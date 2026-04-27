# Changelog

本文件记录抗凝小助手从静态原型进入正式多端开发后的重要变更。


## 2026-04-27

### Added
- 新增项目边界与独立运行报告，明确根目录静态站、微信小程序、Flutter App、Go Server、OpenAPI 契约与文档目录的职责边界。
- 新增静态三端路由覆盖测试 `route-coverage.spec.cjs`，覆盖 wechat/android/ios 的 42 个深链页面。

### Changed
- 静态构建脚本改为统一平台/路由清单生成深链目录，并在构建前校验声明路由必须存在入口文件。
- 文档站首页和 Markdown 预览测试接入项目边界与独立运行报告。

## 2026-04-25

### Added
- 新增端模块功能清单，按微信小程序、Flutter、Go 服务端和 Cloudflare 文档站梳理功能节点、实现方式、方案理由与当前状态。
- 新增架构梳理报告，覆盖端到端架构、模块边界、核心业务流、部署拓扑、安全隐私与后续演进。
- 新增数据库与缓存设计报告，覆盖当前 SQLite MVP、正式 MySQL 表结构、Redis 缓存/限流/提醒锁策略和数据库切换方案。
- 新增当前进度与交付状态文档，按需求、UI、技术方案、验证与下一步计划整理。
- Cloudflare 主页改造为文档入口，按需求与功能、UI 与原型、技术方案与架构分类展示在线文档。

### Changed
- 静态构建脚本新增所有 Markdown 报告的 extensionless HTML 预览路由，同时保留原始 `.md` 资源。
- Markdown 预览测试扩展为覆盖新增文档入口和分类链接。

## 2026-04-24

### Added
- 新增基础数据与数据结构审核清单，列出 settings 默认值、INR 检测方式/异常分层/趋势枚举、服药动作枚举、SQLite 表结构和 API 数据结构，供后续数据库填充前审核。
- 新增服务端 service 单元测试，覆盖 INR 偏移校正、异常分层边界、首页最近 INR/下次检测时间、明日剂量模式、系统记录服药时间和设置校验。
- 新增微信小程序 INR 工具函数运行时单测，覆盖 ±0.1 弱/强提示分层和提示文案。
- 扩充 Flutter 模型解析/序列化测试，覆盖首页 latestInr/nextTestAt、INR trend/tier 枚举兜底、明日剂量、INR 请求 UTC 序列化和检测周期设置。
- INR 校正值计算统一四舍五入到两位小数，避免 2.1 + 0.2 等浮点误差污染趋势/展示数据。
- 新增 Flutter Android/iOS MVP 骨架，包含 API 抽象、领域模型、状态层，以及首页/服药/INR/设置页面。
- 新增服务端 SQLite repository adapter、自动 schema 初始化和 `DATABASE_URL`/`SQLITE_PATH` 配置，`DB_ENGINE=memory` 继续作为默认值。
- 新增 SQLite 仓储持久化测试，覆盖 INR 记录排序、设置保存和服药记录当日查询。
- 对齐 OpenAPI 契约与 Go 服务端接口，覆盖首页汇总、服药记录明日剂量、INR 原始/校正/趋势/异常分层、设置检测方式/偏移量/检测周期。
- 新增 GitHub Actions CI，验证服务端 Go 测试、小程序 TypeScript 测试，以及存在时的产品/Markdown 预览测试。
- 打磨小程序集成体验：API 配置层、请求错误处理、加载/错误状态、首页强提醒、明日剂量选择、INR 双曲线视图模型和设置校验。
- 更新正式开发执行规则：采用多 worktree/多代理并行开发，按 Flutter、服务端 SQLite、API 契约/CI、小程序体验四个模块拆分，最终统一联调、审查并推送 GitHub。
- 新增服务端 `DB_ENGINE` 数据库引擎策略文档与最小 repository 接口抽象，当前默认保持内存仓储，后续预留 SQLite/MySQL 一键切换。
- 新增微信小程序 TypeScript MVP 骨架，包含首页强提醒、校正/原始 INR 展示、服药完成后明日剂量模式选择、INR 双曲线数据结构与设置页。
- 新增 `miniapp` 本地 TypeScript 校验，支持 `cd miniapp && npm test` 验证。
- 新增 Go/Gin 服务端 MVP 骨架，包含健康检查、首页汇总、服药记录、INR 记录和设置接口。
- 新增服务端内存仓储与 API 集成测试，支持 `cd server && go test ./...` 验证。
- 启动微信小程序、Android/iOS Flutter、Go/Gin 服务端同步开发计划。
- 明确开发过程采用 Codex CLI 作为主要编码代理，Hermes 负责拆任务、验收、集成、审查和提交。
- 明确每个阶段及时提交 Git，并同步更新变更记录。
- 明确通过第三方代理进行代码审查，审查记录沉淀到 `docs/reviews/`。
