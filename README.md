# 华法林服药与 INR 监测记录 Demo

一个纯静态个人记录演示页，使用 HTML、CSS 和原生 JavaScript 展示服药记录、INR 监测记录与简单趋势图。

> 本项目仅为演示页面，不构成医疗建议。华法林剂量和 INR 管理请遵医嘱。

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
