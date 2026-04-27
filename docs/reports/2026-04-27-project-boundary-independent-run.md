# 2026-04-27 项目边界与独立运行报告

## 1. 现有问题

本轮盘点前，仓库已经同时包含 Cloudflare 文档站/静态原型、微信小程序、Flutter App、Go API Server 和 OpenAPI 契约，但运行边界还不够显性：

- 根目录静态原型承担文档入口、三端 UI 预览和构建部署，容易被误解为真实 Android/iOS/微信运行时。
- `wechat`、`android`、`ios` 深链目录依赖根目录 `index.html`、`app.js`、`styles.css`，但构建脚本中的路由清单与实际目录清单存在漂移风险。
- 微信小程序实际工程目录是 `miniapp`，而静态预览路由使用 `/wechat/...`，需要在文档中明确映射。
- Flutter CLI 当前机器不可用，无法在本机直接验证 `flutter test`，因此必须把环境限制和独立运行命令写清楚。
- Go Server 是 `server/` 下的独立 Go module，不能从仓库根目录直接 `go run ./cmd/api`，需要避免误操作。

## 2. 改动原因

用户要求各端能作为独立项目运行，除 API 通信外降低耦合，并让 Flutter、Android、iOS 的代码和架构更清晰。本轮目标不是把所有端强行合并，而是明确：

1. 文档站与静态原型只负责展示、审阅和产品验收。
2. 微信小程序真实工程在 `miniapp/`，独立 npm 校验。
3. Flutter App 真实工程在 `app_flutter/`，通过 `ApiClient` 抽象访问后端。
4. Go Server 真实工程在 `server/`，只暴露 JSON API，不服务前端静态文件。
5. 跨端共享只通过 `packages/api-contract/openapi.yaml`、文档和 API 字段语义完成，不共享运行时代码。

## 3. 本轮改动内容

### 3.1 路由构建集中化

- `build-dist.py` 将平台和页面路由拆为 `platforms` 与 `routes` 两个清单，统一生成 `wechat/android/ios` 三个平台的深链目录。
- 构建前新增 route index 校验：如果某个声明路由缺少 `index.html`，构建会直接失败，避免 Cloudflare 上出现某些深链 404。
- 新增 `/wechat/inr-methods/`、`/wechat/test-settings/`、`/wechat/after-dose-rule/` 在 Android/iOS 侧对应路由，保持三端静态预览路由矩阵一致。

### 3.2 路由测试补强

- 新增 `route-coverage.spec.cjs`，用移动端视口逐个访问三端 42 个静态深链路由。
- 每个路由验证 `.app-shell` 存在，并验证 `.device` class 匹配当前平台，避免页面空白或平台样式串台。
- `package.json` 新增 `npm run test:routes`，可与产品验收和 Markdown 预览测试一起运行。

### 3.3 文档与报告入口

- 文档站首页“迭代报告与审计”新增本报告入口。
- `markdown-preview.spec.cjs` 覆盖本报告的 extensionless Markdown 预览 URL。
- `build-dist.py` 将本报告纳入构建输出。

## 4. 当前项目结构与独立运行边界

| 区域 | 定位 | 独立运行/验证命令 | 与其他模块的耦合边界 |
|---|---|---|---|
| 根目录 `index.html`/`app.js`/`styles.css` | Cloudflare 文档站与静态 UI 原型 | `npm run build`、`npm run test:product`、`npm run test:routes`、`npm run test:md-preview` | 只读取本地 Markdown 和静态资源，不作为真实客户端运行时代码 |
| `wechat/` | 微信端静态预览深链 | 由根目录构建脚本复制入口并用 Playwright 验证 | 预览路由，不是小程序工程 |
| `miniapp/` | 微信小程序真实工程 | `cd miniapp && npm test` | 通过 API/契约对接服务端；不依赖根目录静态原型运行 |
| `android/` | Android 静态预览深链 | 由根目录构建脚本复制入口并用 Playwright 验证 | 预览路由；真实 Android 实现当前由 Flutter 承载 |
| `ios/` | iOS 静态预览深链 | 由根目录构建脚本复制入口并用 Playwright 验证 | 预览路由；真实 iOS 实现当前由 Flutter 承载 |
| `app_flutter/` | Flutter Android/iOS App 工程 | `flutter pub get && flutter test`（当前机器缺 Flutter CLI） | 通过 `ApiClient`/`HttpApiClient` 访问 `/api/v1`，默认可用 mock API 独立预览 UI |
| `server/` | Go/Gin API Server | `cd server && go test ./... && go vet ./...`、`go run ./cmd/api` | 只暴露 JSON API，不服务根目录静态文件 |
| `packages/api-contract/` | OpenAPI 跨端契约 | 文档与端侧模型对齐检查 | 共享字段语义，不共享运行时 |
| `docs/` | 需求、设计、技术方案、审计报告 | 由 Markdown 预览构建成在线文档 | 不影响 API/客户端运行 |

## 5. 关键确认结果

- `server/` 已验证为独立 Go module，运行入口是 `cd server && go run ./cmd/api`。
- 服务端路由只注册 `/healthz` 与 `/api/v1/...` JSON API，不依赖根目录 `index.html`、`app.js` 或静态文件。
- Flutter 工程通过 `AppConfig` 的 `API_BASE_URL` 和 `USE_MOCK_API` 环境开关区分真实 API 与 mock API；端侧依赖集中在 API 抽象层。
- 微信小程序目录仍命名为 `miniapp/`，静态预览路由命名为 `wechat/`，两者在文档中明确区分。
- 三端静态深链路由现在由同一清单驱动构建和测试，降低新增页面时漏补 Android/iOS/微信任一平台入口的风险。

## 6. 验证清单

本报告随代码一起提交，最终以实际命令输出为准。本轮需要验证：

- `python3 -m py_compile build-dist.py`。
- `node --check app.js && node --check markdown.js`。
- `npm run build`。
- `npm run test:product`。
- `npm run test:routes`。
- `npm run test:md-preview`。
- `cd miniapp && npm test`。
- `cd server && go test ./... && go vet ./...`。
- `flutter test`：当前机器预期因 `flutter: command not found` 阻塞，只记录为环境限制。
- Cloudflare 部署后访问首页和本报告页，确认在线文档可查看。

## 7. 后续建议

1. 在安装 Flutter SDK 后补跑 `cd app_flutter && flutter test`，并把 Flutter CI 加入 GitHub Actions。
2. 如果后续接入原生 Android/iOS 工程，应分别新增 `android_app/`、`ios_app/` 或等价目录，避免与当前静态预览路由目录混淆。
3. 为 OpenAPI 增加生成 TS/Dart 类型的脚本，进一步降低端侧模型漂移。
4. 服务端后续支持 `PORT`/`API_ADDR` 配置，避免部署时依赖硬编码 `:8080`。
5. MySQL 支持正式实现前，文档继续标注为“规划中”，避免误认为当前可直接切换生产 MySQL。
