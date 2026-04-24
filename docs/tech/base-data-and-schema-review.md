# 基础数据与数据结构审核清单

> 目的：把当前 MVP 需要初始化/枚举/可配置的数据，以及数据库结构一次性列出，方便审核后填充到正式数据库。
>
> 医疗安全边界：本项目只做记录、提醒、风险分层和复查计划管理；不根据 INR 自动给出华法林剂量调整建议。

## 1. 基础数据候选清单

### 1.1 用户默认设置（settings）

| 字段 | 当前默认值 | 说明 | 是否需要你确认 |
|---|---:|---|---|
| `target_inr_min` | `1.8` | 目标 INR 下限，当前按你的目标范围 | 是 |
| `target_inr_max` | `2.5` | 目标 INR 上限，当前按你的目标范围 | 是 |
| `default_medication_time` | `08:00` | 默认服药时间，只做提醒和记录展示 | 是 |
| `test_cycle_unit` | `week` | 检测周期单位：`day`/`week`/`month` | 是 |
| `test_cycle_interval` | `1` | 检测周期间隔，如 `1 week` | 是 |
| `test_methods` | `["hospital_lab","poct_device"]` | 设置页可选检测方式列表 | 是 |
| `inr_offset` | `0` | INR 校正偏移量，校正值 = 原始值 + 偏移量 | 是 |

### 1.2 INR 检测方式枚举

| 枚举值 | 中文展示建议 | 说明 | 默认启用 |
|---|---|---|---|
| `hospital_lab` | 医院检验科静脉血 | 医院实验室检测 | 是 |
| `poct_device` | POCT 指尖血 | 门诊/机构即时检测 | 是 |
| `home_device` | 家用检测仪 | 家庭自测设备 | 待确认 |
| `other` | 其他 | 兜底选项，需备注能力后续补充 | 待确认 |

### 1.3 INR 异常分层枚举

| 枚举值 | 判定规则（基于校正后 INR） | UI 提示强度 | 文案方向 |
|---|---|---|---|
| `normal` | `target_min <= value <= target_max` | 正常 | 在目标范围内，继续记录和按计划复查 |
| `weak_low` | `target_min - 0.1 <= value < target_min` | 弱提示 | 略低于目标范围 0.1 以内，留意趋势 |
| `strong_low` | `value < target_min - 0.1` | 强提示 | 明显低于目标范围，联系医生/抗凝门诊确认 |
| `weak_high` | `target_max < value <= target_max + 0.1` | 弱提示 | 略高于目标范围 0.1 以内，留意趋势 |
| `strong_high` | `value > target_max + 0.1` | 强提示 | 明显高于目标范围，联系医生/抗凝门诊确认 |

### 1.4 INR 趋势枚举

| 枚举值 | 判定规则（基于校正后 INR） | 说明 |
|---|---|---|
| `low` | `< target_min` | 低于范围 |
| `in_range` | `target_min <= value <= target_max` | 范围内 |
| `high` | `> target_max` | 高于范围 |

趋势图要求：同时显示 `raw_value`（校准前）和 `corrected_value`（校准后）两条曲线。页面主显示使用校正后 INR，校准前值以弱化方式同步展示。

### 1.5 服药动作与明日剂量模式

| 类型 | 枚举值 | 中文展示建议 | 说明 |
|---|---|---|---|
| `action_type` | `taken` | 已服药 | 用户点击服药完成时，用系统时间写入 `recorded_at` |
| `action_type` | `paused` | 医嘱暂停 | 仅记录状态，不提供剂量建议 |
| `action_type` | `missed` | 未服/漏服记录 | 当前不做补服流程，只记录事实 |
| `tomorrow_dose_mode` | `planned` | 明日按计划服用 | 不需要填写 `tomorrow_dose_tablets` |
| `tomorrow_dose_mode` | `manual` | 手动填写明日剂量 | 需要填写 `tomorrow_dose_tablets` |

## 2. 当前数据库结构（SQLite MVP）

### 2.1 `settings` 用户设置表

| 字段 | 类型 | 约束/默认 | 说明 |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY, 固定 `1` | 单用户 MVP 设置行 |
| `target_inr_min` | REAL | NOT NULL | 目标 INR 下限 |
| `target_inr_max` | REAL | NOT NULL | 目标 INR 上限 |
| `default_medication_time` | TEXT | NOT NULL | 默认服药时间，格式 `HH:mm` |
| `test_cycle_unit` | TEXT | NOT NULL | `day`/`week`/`month` |
| `test_cycle_interval` | INTEGER | NOT NULL, `>=1`（业务校验） | 检测间隔 |
| `test_methods` | TEXT | NOT NULL | JSON 数组字符串，如 `["hospital_lab"]` |
| `inr_offset` | REAL | NOT NULL | 校正偏移量 |

### 2.2 `inr_records` INR 记录表

| 字段 | 类型 | 约束/索引 | 说明 |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | 自增主键，API 展示为 `inr-{id}` |
| `raw_value` | REAL | NOT NULL | 检测原始 INR |
| `corrected_value` | REAL | NOT NULL | 校正后 INR，所有主展示使用此值 |
| `trend` | TEXT | NOT NULL DEFAULT `in_range` | `low`/`in_range`/`high` |
| `abnormal_tier` | TEXT | NOT NULL | `normal`/`weak_low`/`weak_high`/`strong_low`/`strong_high` |
| `test_method` | TEXT | NOT NULL | 检测方式枚举 |
| `tested_at` | TEXT | NOT NULL, `idx_inr_records_tested_at DESC` | 检测时间，RFC3339/UTC 存储字符串 |

### 2.3 `medications` 服药记录表

| 字段 | 类型 | 约束/索引 | 说明 |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | 自增主键，API 展示为 `med-{id}` |
| `action_type` | TEXT | NOT NULL | `taken`/`paused`/`missed` |
| `actual_dose_tablets` | REAL | NOT NULL | 本次记录剂量（片数） |
| `client_time` | TEXT | 当前保留未用 | 后续可记录客户端时间/时区 |
| `recorded_at` | TEXT | NOT NULL, `idx_medications_recorded_at` | 系统记录时间；服药完成按操作时系统时间写入 |
| `tomorrow_dose_mode` | TEXT | NOT NULL | `planned`/`manual` |
| `tomorrow_dose_tablets` | REAL | NULL | 手动填写明日剂量时使用 |

## 3. API 数据结构（供前端/小程序/Flutter 审核）

### 3.1 首页汇总 `HomeSummary`

```json
{
  "prominentReminder": { "level": "strong", "title": "INR 结果需关注", "body": "请联系医生确认后续处理，本应用不提供剂量调整建议。" },
  "latestInr": {
    "id": "inr-1",
    "rawValue": 2.6,
    "correctedValue": 2.7,
    "trend": "high",
    "abnormalTier": "strong_high",
    "testMethod": "hospital_lab",
    "testedAt": "2026-04-24T08:00:00Z"
  },
  "nextTestAt": "2026-05-01T08:00:00Z",
  "todayMedication": { "status": "pending", "plannedDoseTablets": 1.5 }
}
```

### 3.2 新增 INR 请求 `CreateINRRecordRequest`

```json
{
  "rawValue": 2.1,
  "offset": 0.1,
  "testMethod": "hospital_lab",
  "testedAt": "2026-04-24T08:00:00Z"
}
```

说明：`offset` 可省略；省略时使用 settings 里的 `inr_offset`。后端会把 `rawValue + offset` 四舍五入到两位小数后写入 `correctedValue`。

### 3.3 新增服药记录请求 `CreateMedicationRecordRequest`

```json
{
  "actionType": "taken",
  "actualDoseTablets": 1.5,
  "tomorrowDoseMode": "manual",
  "tomorrowDoseTablets": 1.25
}
```

说明：`tomorrowDoseMode=planned` 时可不传 `tomorrowDoseTablets`；`recordedAt` 由后端系统时间生成，不由用户填写。

## 4. 待你审核/补充的问题

1. 默认检测方式是否只保留 `hospital_lab` 和 `poct_device`，还是同时启用 `home_device`？
2. 默认检测周期是否按 `1 week`，还是你希望默认 `N day/week/month`？
3. `paused`、`missed` 是否需要在 UI 上展示，还是先只保留后端枚举？
4. 后续是否需要把 `test_methods` 从 JSON 字符串升级为独立字典表/用户启用表？当前 MVP 为简化设计。
5. 是否要新增“备注/检测机构/设备型号/试纸批号”等字段？当前未纳入 MVP 表结构。
