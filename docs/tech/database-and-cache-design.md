# 数据库与缓存设计报告

> 目标：说明当前 SQLite MVP、正式 MySQL 设计、Redis 缓存/限流/提醒辅助方案，以及为什么这样设计。

## 1. 设计目标

> 本轮口径补充：INR 校正偏移必须按记录保存快照。检测方式设置中的偏移量只决定新记录的默认校正值，不得批量改写历史 `corrected_value`。下次检测时间以最近一次 `inr_records.tested_at` 加检测周期计算。


1. **主数据只以数据库为准**：缓存可丢失、可重建，不保存唯一事实。
2. **健康数据可追溯**：INR 同时保存 raw、offset、corrected、method、testedAt。
3. **历史不被设置变更污染**：修改检测方式或 offset 后，不批量改写历史记录。
4. **时间语义明确**：服药 `recorded_at` 为系统操作时间；INR `tested_at` 为检测发生时间。
5. **可从 SQLite 平滑升级 MySQL**：repository interface 保持稳定，替换实现即可。

## 2. 当前 SQLite MVP

当前实现位于 `server/internal/repository/sqlite/repository.go`。

### 2.1 settings

| 字段 | 类型 | 用途 | 方案理由 |
|---|---|---|---|
| `id` | INTEGER | 单用户固定 1 | MVP 简化，不引入用户表 |
| `target_inr_min/max` | REAL | INR 目标范围 | 支撑异常分层和首页提示 |
| `default_medication_time` | TEXT | 默认服药时间 | 首页和提醒展示 |
| `test_cycle_unit` | TEXT | day/week/month | 支持用户自由周期 |
| `test_cycle_interval` | INTEGER | 间隔数 | 与 unit 组合计算 nextTestAt |
| `test_methods` | TEXT JSON | 可选检测方式 | MVP 简化，正式版可拆表 |
| `inr_offset` | REAL | 默认偏移量 | 新增 INR 时计算 correctedValue |

### 2.2 inr_records

| 字段 | 类型 | 用途 | 方案理由 |
|---|---|---|---|
| `id` | INTEGER | 自增主键 | 简单稳定 |
| `raw_value` | REAL | 校准前 INR | 弱展示与趋势对照 |
| `corrected_value` | REAL | 校正后 INR | 所有主展示和分层依据 |
| `trend` | TEXT | low/in_range/high | 前端无需重复判断 |
| `abnormal_tier` | TEXT | normal/weak/strong | 支撑 UI 弱/强提示 |
| `test_method` | TEXT | 检测方式 | 追踪数据来源 |
| `tested_at` | TEXT | 检测时间 | 按时间排序，趋势展示 |

索引：`idx_inr_records_tested_at(tested_at DESC)`。

### 2.3 medications

| 字段 | 类型 | 用途 | 方案理由 |
|---|---|---|---|
| `id` | INTEGER | 自增主键 | 简单稳定 |
| `action_type` | TEXT | taken/paused/missed | 只记录事实，不做补服 |
| `actual_dose_tablets` | REAL | 实际剂量片数 | 用户/医生确认后的记录 |
| `client_time` | TEXT | 预留客户端时间 | 后续离线同步/冲突分析 |
| `recorded_at` | TEXT | 系统记录时间 | 满足“按操作服药类型的系统时间记录” |
| `tomorrow_dose_mode` | TEXT | planned/manual | 完成服药后选择明日剂量方式 |
| `tomorrow_dose_tablets` | REAL NULL | 手动明日剂量 | 只在 manual 时填写 |

索引：`idx_medications_recorded_at(recorded_at)`。

## 3. 正式 MySQL 设计

### 3.1 users

```sql
CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  nickname VARCHAR(64) NOT NULL DEFAULT '',
  avatar_url VARCHAR(512) NOT NULL DEFAULT '',
  timezone VARCHAR(64) NOT NULL DEFAULT 'Asia/Shanghai',
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL
);
```

**理由**：正式版必须多用户；timezone 用于展示和提醒计算。

### 3.2 user_auth_accounts

```sql
CREATE TABLE user_auth_accounts (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  provider VARCHAR(32) NOT NULL,
  provider_user_id VARCHAR(128) NOT NULL,
  union_id VARCHAR(128) NOT NULL DEFAULT '',
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  UNIQUE KEY uk_provider_user (provider, provider_user_id),
  KEY idx_user_id (user_id)
);
```

**理由**：支持微信 openid/unionid，后续可扩展手机号、Apple、Google。

### 3.3 user_settings

```sql
CREATE TABLE user_settings (
  user_id BIGINT PRIMARY KEY,
  inr_target_lower DECIMAL(4,2) NOT NULL DEFAULT 1.80,
  inr_target_upper DECIMAL(4,2) NOT NULL DEFAULT 2.50,
  default_medication_time TIME NOT NULL DEFAULT '08:00:00',
  medication_name VARCHAR(64) NOT NULL DEFAULT 'Marevan',
  tablet_mg DECIMAL(5,2) NOT NULL DEFAULT 3.00,
  test_cycle_unit ENUM('day','week','month') NOT NULL DEFAULT 'week',
  test_cycle_interval INT NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL
);
```

**理由**：目标范围、服药时间、检测周期是首页/提醒/分层核心配置。

### 3.4 inr_test_methods

```sql
CREATE TABLE inr_test_methods (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  code VARCHAR(32) NOT NULL,
  name VARCHAR(64) NOT NULL,
  offset_value DECIMAL(4,2) NOT NULL DEFAULT 0.00,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  note VARCHAR(255) NOT NULL DEFAULT '',
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  KEY idx_user_enabled (user_id, enabled),
  UNIQUE KEY uk_user_code (user_id, code)
);
```

**理由**：检测方式未来会有用户自定义 offset；拆表比 settings JSON 更利于审计和扩展。

### 3.5 inr_records

```sql
CREATE TABLE inr_records (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  method_id BIGINT NULL,
  method_code VARCHAR(32) NOT NULL,
  raw_value DECIMAL(4,2) NOT NULL,
  offset_value DECIMAL(4,2) NOT NULL DEFAULT 0.00,
  corrected_value DECIMAL(4,2) NOT NULL,
  trend ENUM('low','in_range','high') NOT NULL,
  abnormal_tier ENUM('normal','weak_low','weak_high','strong_low','strong_high') NOT NULL,
  tested_at DATETIME(3) NOT NULL,
  source ENUM('manual','device','import') NOT NULL DEFAULT 'manual',
  note VARCHAR(255) NOT NULL DEFAULT '',
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  KEY idx_user_tested_at (user_id, tested_at DESC),
  KEY idx_user_tier (user_id, abnormal_tier, tested_at DESC)
);
```

**为什么保存 method_code 和 offset_value 快照**：检测方式可能被改名或修改 offset，历史 INR 必须保持当时的计算依据。

### 3.6 medication_plans / medication_plan_items

```sql
CREATE TABLE medication_plans (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  name VARCHAR(64) NOT NULL DEFAULT '默认计划',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  start_date DATE NOT NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  KEY idx_user_active (user_id, is_active)
);

CREATE TABLE medication_plan_items (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  plan_id BIGINT NOT NULL,
  sequence_no INT NOT NULL,
  dose_tablets DECIMAL(5,2) NOT NULL,
  dose_mg DECIMAL(5,2) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  UNIQUE KEY uk_plan_seq (plan_id, sequence_no)
);
```

**理由**：支持 1.25/1.5 片交替的循环计划；后续可扩展按星期计划。

### 3.7 medication_records

```sql
CREATE TABLE medication_records (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  record_date DATE NOT NULL,
  action_type ENUM('taken','paused','missed') NOT NULL,
  planned_dose_tablets DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  actual_dose_tablets DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  actual_dose_mg DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  operation_time DATETIME(3) NOT NULL,
  client_time DATETIME(3) NULL,
  tomorrow_dose_mode ENUM('planned','manual') NOT NULL DEFAULT 'planned',
  tomorrow_dose_tablets DECIMAL(5,2) NULL,
  note VARCHAR(255) NOT NULL DEFAULT '',
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  UNIQUE KEY uk_user_record_date (user_id, record_date),
  KEY idx_user_operation_time (user_id, operation_time DESC)
);
```

**理由**：一天一个最终记录，操作时间可追溯；不提供补服流程。

### 3.8 reminder_settings / reminder_events

```sql
CREATE TABLE reminder_settings (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  reminder_type ENUM('medication','inr_test','inr_abnormal') NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  remind_time TIME NULL,
  advance_days INT NOT NULL DEFAULT 0,
  channel ENUM('app','wechat','weixin') NOT NULL DEFAULT 'app',
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  KEY idx_user_type (user_id, reminder_type)
);

CREATE TABLE reminder_events (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  reminder_type VARCHAR(32) NOT NULL,
  scheduled_at DATETIME(3) NOT NULL,
  sent_at DATETIME(3) NULL,
  status ENUM('pending','sent','failed','cancelled') NOT NULL DEFAULT 'pending',
  dedupe_key VARCHAR(128) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  UNIQUE KEY uk_dedupe (dedupe_key),
  KEY idx_due (status, scheduled_at)
);
```

**理由**：提醒需要可追踪、可重试、可去重；不只靠 Redis，否则重启/丢缓存会丢提醒。

## 4. Redis 设计

Redis 不作为主库，只做缓存、锁、限流和短期队列辅助。

| Key | 类型 | TTL | 用途 | 方案理由 |
|---|---|---:|---|---|
| `session:{token}` | string/hash | 7-30 天 | 登录态 | API 快速鉴权，主账号仍在 MySQL |
| `wx:login:code:{code}` | string | 5 分钟 | 微信 code 防重放 | 防止同一个 code 重复换 session |
| `rate:{user_id}:{api}` | counter | 60 秒 | 用户级限流 | 防误触/恶意刷写健康数据 |
| `home:{user_id}` | json | 1-5 分钟 | 首页聚合缓存 | 首页高频访问，短 TTL 可接受 |
| `inr:list:{user_id}:{range}` | json | 1-5 分钟 | INR 列表/趋势缓存 | 读多写少；新增 INR 后删除 |
| `settings:{user_id}` | json | 5-30 分钟 | 用户设置缓存 | 目标范围/周期常读少改 |
| `reminder:lock:{yyyyMMddHHmm}` | string NX | 1-10 分钟 | 定时任务锁 | 多实例避免重复扫描发送 |
| `reminder:dedupe:{dedupe_key}` | string | 1-7 天 | 提醒发送去重 | 避免用户收到重复提醒 |
| `idempotency:{user_id}:{client_id}` | string | 1-7 天 | 客户端离线重放幂等 | 后续离线同步避免重复记录 |

## 5. 缓存失效策略

| 写操作 | 需要清理的缓存 | 理由 |
|---|---|---|
| 新增服药记录 | `home:{user_id}` | 首页服药状态变化 |
| 新增 INR | `home:{user_id}`、`inr:list:{user_id}:*` | 最近 INR、趋势、异常提醒变化 |
| 修改设置 | `home:{user_id}`、`settings:{user_id}`、`inr:list:{user_id}:*` | 目标范围/周期/offset 影响展示和分层 |
| 修改检测方式 | `settings:{user_id}` | 检测方式列表变化 |
| 发送提醒 | `reminder:dedupe:*` | 防重复发送 |

## 6. 数据库切换方案

1. 保持 `repository.Repository` 接口不变。
2. 新增 `server/internal/repository/mysql` 实现。
3. config 增加 `DB_ENGINE=sqlite|mysql` 与 DSN。
4. 测试层同时跑 repository contract tests。
5. 先双写不建议；MVP 数据量小，正式前一次性迁移更简单。

**理由**：业务层不关心数据库类型，后续一键切换数据库引擎更可控。

## 7. 备份与恢复

- SQLite 阶段：定期复制 DB 文件到备份目录。
- MySQL 阶段：每日全量备份 + binlog 增量；至少保留 7-30 天。
- 导出文件：后续放对象存储，生成临时下载链接。
- 恢复演练：至少每次 schema 大改后做一次恢复验证。

## 8. 结论

当前 SQLite 结构已经覆盖 MVP 核心闭环；正式化时应升级为 MySQL 多用户表，并引入 Redis 做短期缓存、限流、提醒锁和幂等去重。关键点是：**数据库保存事实，Redis 只做辅助；历史 INR 保存当时 raw/offset/corrected，避免未来设置变更破坏追溯性。**
