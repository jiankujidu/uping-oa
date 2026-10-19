# 反代部署实况与国内可达方案（2026-10-19 更新：myoa.jk93.qzz.io 已打通）

> 2026-10-19 用 Cloudflare **OAuth 登录**成功接管账号（`36dc817a796a8f194ad1631a646d6762`），
> 部署 Worker `uping-oa`，路由到 `myoa.jk93.qzz.io/*`，静态资源 + `/proxy` 反代同源网关。
> 真接口已验证可用，详见下文「线上验证」。

## 之前 5 个 token 全废的真正原因（已定位）

之前用户连续发 5 个 Cloudflare API Token 全部 401 / 403，**不是账号坏，是 token 类型选错了**：
- 截图里除了「您的 API 令牌」，还同时给出「访问密钥 ID / 秘密访问密钥 / S3 API 端点」三字段。
- 这是 Cloudflare 的 **R2 API 令牌**（S3 凭证），只能调 R2 的 S3 兼容接口。
- 拿来调 `api.cloudflare.com/client/v4`（Worker 管理）必然 401。
- 正确做法：Dashboard → 我的个人资料 → API 令牌 → 创建令牌 → 选 **「编辑 Cloudflare Workers」(Edit Cloudflare Workers)** 模板。

而本次直接用 **wrangler OAuth**（`wrangler login --browser=false`）接管，OAuth 成功、权限里自带
`workers (write)` `zone (read)` `pages (write)`，无需手工建令牌，绕开了 token 类型踩坑。

## 账号级 API 401 的真相（DNS 污染，不是账号坏）

之前判断「账号级异常」是误判。真相：
- `api.cloudflare.com` / `dash.cloudflare.com` 在本机网络里 **DNS 被污染**，解析到错误 IP，
  wrangler / curl 直连会「无法解析主机」。
- 修复：用 DoH 拿真实 IP，并让 Node 优先走 IPv4：
  ```
  RES=$(curl -s "https://doh.pub/dns-query?name=api.cloudflare.com&type=A" -H "accept: application/dns-json" | grep -oE '"data":"[0-9.]+"' | grep -oE '[0-9.]+' | head -1)   # 104.19.193.29
  NODE_OPTIONS="--dns-result-order=ipv4first" npx wrangler whoami
  NODE_OPTIONS="--dns-result-order=ipv4first" npx wrangler deploy
  ```
- OAuth 登录后 credentials 存在 `~/.config/xdg.config/.wrangler/config/default.toml`，
  后续所有 wrangler 命令都加 `NODE_OPTIONS=--dns-result-order=ipv4first` 即可。

## 部署实况

| 项 | 值 |
|---|---|
| Worker 名 | `uping-oa` |
| 账号 | `36dc817a796a8f194ad1631a646d6762`（cmilove@163.com） |
| 触发器 | `https://uping-oa.jiankujidu.workers.dev`（境外备用，大陆被污染） |
| 自定义域 | `myoa.jk93.qzz.io/*`（中国大陆可达，本次目标） |
| 静态资源 | `../dist`（55 个文件，绑定 `env.ASSETS`，SPA fallback） |
| 反代前缀 | `/proxy/*` → `https://oa.upingbio.cn/*`（去前缀，注入 Referer，剥 Origin） |
| Cookie 改写 | 剥 `Domain=`、`SameSite=Lax`（同源一方 Cookie，无需 None） |
| Origin 白名单 | `myoa.jk93.qzz.io`、`jiankujidu.github.io`、`yejing.github.io`、localhost 5173/4173 |

## 线上验证（2026-10-19）

| 请求 | 结果 |
|---|---|
| `GET https://myoa.jk93.qzz.io/` | 200，`<title>优品OA</title>` |
| `GET /assets/index-DmoGeG0s.js` | 200 |
| `GET /foo/bar/baz` | 200（SPA fallback 到 index.html） |
| `POST /proxy/home/index/index`（带 `X-Requested-With: XMLHttpRequest`） | `{"code":404,"msg":"请先登录"}` **真 OA 业务响应，非 WAF 403** |
| `POST /proxy/home/index/index`（不带 XHR 头） | 302 → `/home/login/index.html`（OA 登录重定向） |

结论：`myoa.jk93.qzz.io` 已经能拿到 OA 真实接口响应，前端把 `VITE_PROXY_BASE` 留空时
（自有域名走同源 `/proxy`，见 `src/api/client.ts`）会自动走真接口；`*.github.io` 无 `/proxy` 时
自动降级内置 mock（顶栏出 banner）。

## 前端同源逻辑（src/api/client.ts）

`PROXY_BASE` 解析优先级：
1. `localStorage 'upoa:proxy_base'`（运行时可改，不重建）
2. 构建期 `VITE_PROXY_BASE`
3. 默认同源：`location.hostname` 不是 `*.github.io` 时 → `/proxy`（自有域名/本地）
4. `*.github.io` → 空串 → 自动降级 mock

## 维护命令

```
cd uping-oa-web/proxy
NODE_OPTIONS="--dns-result-order=ipv4first" npx wrangler deploy            # 重新部署（含 route + assets）
NODE_OPTIONS="--dns-result-order=ipv4first" npx wrangler whoami           # 查登录
NODE_OPTIONS="--dns-result-order=ipv4first" npx wrangler tail uping-oa     # 看实时请求日志
NODE_OPTIONS="--dns-result-order=ipv4first" npx wrangler secret:key list  # 查密钥（无）
```

## 安全：作废已暴露凭据

- 之前会话里明文粘过的 **R2 令牌（Access Key / Secret / 端点）** → R2 控制台作废
- **5 个 Cloudflare API Token（全 401）** → 个人资料 → API 令牌 → 逐个撤销
- **GitHub PAT `github_pat_11AZG4BXI0ihaL2cdYw96X_…`**（明文粘过两次） → github.com/settings/tokens 撤销
- **OA 系统账号密码**（曾截图） → 改密

OAuth 凭据存在本机 `~/.config/xdg.config/.wrangler/config/default.toml`，**别提交 git**（已在 .gitignore）。
