# Changelog

本文件记录抗凝小助手从静态原型进入正式多端开发后的重要变更。

## 2026-04-24

### Added
- 新增微信小程序 TypeScript MVP 骨架，包含首页强提醒、校正/原始 INR 展示、服药完成后明日剂量模式选择、INR 双曲线数据结构与设置页。
- 新增 `miniapp` 本地 TypeScript 校验，支持 `cd miniapp && npm test` 验证。
- 新增 Go/Gin 服务端 MVP 骨架，包含健康检查、首页汇总、服药记录、INR 记录和设置接口。
- 新增服务端内存仓储与 API 集成测试，支持 `cd server && go test ./...` 验证。
- 启动微信小程序、Android/iOS Flutter、Go/Gin 服务端同步开发计划。
- 明确开发过程采用 Codex CLI 作为主要编码代理，Hermes 负责拆任务、验收、集成、审查和提交。
- 明确每个阶段及时提交 Git，并同步更新变更记录。
- 明确通过第三方代理进行代码审查，审查记录沉淀到 `docs/reviews/`。
