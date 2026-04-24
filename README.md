# 华法林服药与 INR 监测记录 Demo

一个纯静态个人记录演示页，使用 HTML、CSS 和原生 JavaScript 展示服药记录、INR 监测记录与简单趋势图。Cloudflare 预览中访问 `.md` 文档会自动渲染为排版后的阅读页，并保留 `?raw=1` 查看原始 Markdown。

> 本项目仅为演示页面和技术规划沉淀，不构成医疗建议。华法林剂量和 INR 管理请遵医嘱。

## 文档目录

- UI 设计说明：[`docs/ui/README.md`](docs/ui/README.md)
- 技术方案：[`docs/tech/technical-proposal.md`](docs/tech/technical-proposal.md)

当前约定：

- `docs/ui/`：放 UI 原型、设计说明、交互规则。
- `docs/tech/`：放服务端、小程序、Android/iOS、数据库、接口等技术方案。

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
