# 华法林服药与 INR 监测记录 Demo

一个纯静态个人记录演示页，使用 HTML、CSS 和原生 JavaScript 展示服药记录、INR 监测记录与简单趋势图。Cloudflare 预览中访问 `.md` 文档会自动渲染为排版后的阅读页，并保留 `?raw=1` 查看原始 Markdown。

> 本项目仅为演示页面和技术规划沉淀，不构成医疗建议。华法林剂量和 INR 管理请遵医嘱。

## 文档目录

- UI 设计说明：[`docs/ui/README.md`](docs/ui/README.md)
- 技术方案：[`docs/tech/technical-proposal.md`](docs/tech/technical-proposal.md)
- 基础数据与数据结构审核清单：[`docs/tech/base-data-and-schema-review.md`](docs/tech/base-data-and-schema-review.md)

当前约定：

- `docs/ui/`：放 UI 原型、设计说明、交互规则。
- `docs/tech/`：放服务端、小程序、Android/iOS、数据库、接口等技术方案。
- `docs/plans/`：放正式开发拆解计划。
- `packages/api-contract/`：放 OpenAPI 契约，供服务端、微信小程序、Flutter 共用；当前覆盖首页汇总、服药记录、INR raw/corrected/trend/tier 与设置项。
- `server/`：Go/Gin 服务端。
- `miniapp/`：微信小程序 TypeScript 工程。
- `app_flutter/`：Android/iOS Flutter 工程。

## 正式开发执行方式

- 以当前原型方案为准，微信小程序、Android/iOS、服务端同步推进。
- 开发过程中优先使用 Codex CLI 作为编码代理；Hermes 负责任务拆解、验收、跨端沟通、集成、提交和部署。
- 每个阶段及时提交 Git，并在 `CHANGELOG.md` 记录变更。
- 关键代码通过第三方代理/独立上下文审查，审查记录沉淀到 `docs/reviews/`。
- 医疗相关逻辑只做记录、提醒、风险分层，不提供剂量调整建议。

## 本地验证

```bash
npm run build
npm run test:product
npm run test:md-preview
cd miniapp && npm test
```

服务端测试建议使用临时可写 Go 缓存，和 CI 保持一致：

```bash
cd server
GOCACHE=/tmp/warfarin-go-build-cache GOMODCACHE=/tmp/warfarin-go-mod-cache go test ./...
```

GitHub Actions 会运行服务端 Go 测试、微信小程序 TypeScript 校验，以及存在时的产品/Markdown 预览测试。

当前环境提示：Go、Node、Codex 可用；Flutter SDK 暂未安装，Flutter 阶段会先生成源码骨架与文档，安装 SDK 后补跑 `flutter test`。

## 本地预览

```bash
python3 -m http.server 8000
```

然后打开：

```text
http://localhost:8000
```

## 部署到 Cloudflare Workers Static Assets

需要先安装并登录 Wrangler：

```bash
npm install -g wrangler
wrangler login
```

部署：

```bash
wrangler deploy
```

也可以将本目录作为静态站点直接部署到 Cloudflare Pages。
