# 抗凝小助手微信小程序

`miniapp/` 是微信小程序真实工程目录，区别于根目录下用于 Cloudflare 静态预览的 `/wechat/...` 路由目录。

## 独立运行边界

- 本目录通过 TypeScript 小程序代码和本地测试验证业务交互模型。
- 与服务端只通过 `/api/v1` JSON API 和 `packages/api-contract/openapi.yaml` 字段语义对接。
- 不依赖根目录 `app.js`、`styles.css`、`index.html` 运行；这些文件只用于静态产品原型和文档站。

## 本地验证

```bash
cd miniapp
npm test
```

后续接入真实微信开发者工具时，继续以本目录的 `project.config.json` 作为小程序工程入口。
