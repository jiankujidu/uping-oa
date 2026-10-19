# 反代部署实况与国内可达方案

> 2026-10-19 用用户提供的 Cloudflare 凭据实操后的结论。

## 已完成

**Cloudflare Worker `uping-oa-proxy` 已部署上线**（API 返回 version ID `f0f2ddd3`，源码已在线）：

- 上游：`https://oa.upingbio.cn`（注入 Referer + 桌面 UA 过 WAF，剥离外部 Origin）
- CORS：白名单 Origin + `credentials: true` + Set-Cookie 改写 `SameSite=None; Secure`
- OSS 白名单：`yejing.github.io`、localhost 5173/4173
- 健康检查：`GET /healthz` → `ok`
- 触发地址：`https://uping-oa-proxy.jiankujidu1.workers.dev`

## ⚠️ 硬事实：workers.dev 在中国大陆不可达（已实测）

| 测试 | 结果 |
|---|---|
| 本机 DNS 解析 | 返回 199.59.150.40（停放 IP，污染） |
| 真实 IP 172.67.174.215 / 104.21.47.248 | TCP 连接 0.25s 秒拒（SNI 阻断） |
| 阿里 DoH | 104.244.43.52（同样污染） |
| 腾讯 DoH | 拿到真实 IP，但 IP 本身被断 |

**worker 代码没问题，是 workers.dev 这个域在国内被断。** 用户和最终用户都在国内 → 需要下面三条可达路径之一。

## 三条可达路径（按推荐排序）

### 路径 1：Worker 绑自定义域（推荐，0 维护）

你的 CF 账户有域名 `jiankujidu.cloudns.club`，但当前 `status: pending / ns_mismatch`（注册商 NS 没指过来）。

1. cloudns.club 后台（或注册商）把 NS 改成 CF 指定的两台：
   `aspen.ns.cloudflare.com` / `max.ns.cloudflare.com`
2. zone 变 active 后，给 worker 加自定义域：
   ```bash
   export CLOUDFLARE_API_TOKEN=<你的token>
   export CLOUDFLARE_ACCOUNT_ID=5ee5e384cd0b4d553c383a450a2e3aab
   npx wrangler deploy   # 已配 wrangler.toml
   # 然后 Dashboard → Workers → uping-oa-proxy → Triggers → Custom Domains
   # 添加 oa.jiankujidu.cloudns.club
   ```
   （自定义域走 CF anycast IP，不受 workers.dev 专项阻断；cloudns.club 是免费域，稳定性自担）
3. 站点侧切换（二选一）：
   - 重建：`.env.production` 写 `VITE_PROXY_BASE=https://oa.jiankujidu.cloudns.club` 后 `npm run build`
   - **不重建**（已支持）：浏览器控制台执行
     `localStorage.setItem('upoa:proxy_base','https://oa.jiankujidu.cloudns.club')` 后刷新。清空该 key 即回落构建期值/mock。

### 路径 2：fnOS NAS Nginx 反代（最稳，依赖你的域名/DDNS）

`proxy/nginx.conf.example` 已写好。核心就 3 行：

```nginx
location /oa-proxy/ {
    proxy_pass https://oa.upingbio.cn/;
    proxy_set_header Referer https://oa.upingbio.cn/;
    proxy_set_header User-Agent "Mozilla/5.0 ... Chrome/120 ...";
    proxy_hide_header Access-Control-Allow-Origin;
    add_header Access-Control-Allow-Origin $http_origin always;
    add_header Access-Control-Allow-Credentials true always;
}
```

配好后站点用 `https://<你的NAS域名>/oa-proxy/`。注意 NAS 侧 HTTPS 证书 + 手机端浏览器兼容。

### 路径 3：继续用 mock 演示模式

不配任何代理，应用自动走内置 mock（真机响应脱敏），全部页面可浏览可操作，顶栏黄条提示。适合演示和UI验收。

## 应用侧状态

- `src/api/client.ts` 已支持**运行时切换代理**（localStorage `upoa:proxy_base` 优先于构建期 env）
- 反代不可达 → 自动降级 mock + 黄条，**绝不静默失败**

## 待办

- [ ] 用户确认走路径 1 还是 2（或先 3）
- [ ] 路径 1 需要用户操作 cloudns NS 切换（我做不了）
- [ ] **部署完成后到 Cloudflare Dashboard → My Profile → API Tokens 吊销本次 token**（会话中已明文暴露，建议重签一个最小权限的：Workers Scripts:Edit 即可）

---

# 追加：绑定 myoa.jk93.qzz.io（2026-10-19 下午）

## 当前进度

| 项 | 状态 |
|---|---|
| Worker `uping-oa-proxy` | ✅ 已在旧账户 5ee5e384 部署（version f0f2ddd3） |
| 新 CF 账户 token（36dc817a） | ❌ **Invalid access token**（连 R2 端点都拒，重试 5 次无效）——非生效延迟，token 无效或权限为空 |
| `myoa.jk93.qzz.io` DNS | ⚠️ 已有 A 记录 → 104.21.7.104 / 172.67.130.29（CF anycast IP），说明 qzz.io 侧已配指向 |
| `qzz.io` NS | ❌ 在 qzz.io 自己（ns1/2/3.qzz.io），**不在 CF** |
| jk93.qzz.io 是否已 add site 到 CF 账户 | ❓ token 无效查不了 |

## 卡点分析

CF Worker 自定义域（Custom Domains）有硬性前置：**域名的 NS 必须在 CF 且 zone active**。现在两层问题：

1. **token 无效** → 任何 API 操作都做不了
2. **NS 在 qzz.io** → 即使 token 修好，若 `jk93.qzz.io` 没 add site 到 CF + NS 未切换，custom domain 绑定会失败（CF 收不到该域的 DNS 查询，只做了 A 记录指向没用）

## 需要用户做的事（按序）

1. **重新创建 API token**（Dashboard → My Profile → API Tokens → Create Token → 用 "Edit Cloudflare Workers" 模板，权限至少：`Workers Scripts: Edit` + `Zone: Read`；Account Resources 选 `36dc817a...` 账户）。
   注意：截图里那两个 token 都来自「R2 S3 凭证」页签，第一个（5ee5e384 账户）恰好有 Workers 权限，第二个（36dc817a 账户）没有——第二个页面创建时权限模板选错/为空。
2. **确认 `jk93.qzz.io` 是否已加入 CF**：Dashboard → Websites 里有没有这个域；没有就 Add Site（按提示把 NS 改成 `aspen.ns.cloudflare.com` / `max.ns.cloudflare.com`）。
3. **qzz.io 面板能否改 NS**：免费二级域通常只能用托管 DNS、不准改 NS。**若不能改 NS → CF 自定义域路走不通，直接选 NAS Nginx 方案**：把 `myoa.jk93.qzz.io` 的 A 记录改成 NAS 公网 IP，Nginx 按 `proxy/nginx.conf.example` 反代。
4. NS 生效后我来做：把 worker 也部署到 36dc817a 账户（或从旧账户迁移），再绑 custom domain `myoa.jk93.qzz.io`，最后站点侧 `localStorage.setItem('upoa:proxy_base','https://myoa.jk93.qzz.io')`。

---

# 二次尝试（同日 13:42，用户重签 token 后）

## 对照实验结果

| Token | 账户 | 结果 |
|---|---|---|
| `cfat_1dSXJ...`（上午） | 5ee5e384 | ✅ **200 仍可用**（workers/scripts 正常列出） |
| `cfat_sguI2...`（下午第一次） | 36dc817a | ❌ zones/workers/r2 全部 Invalid access token |
| `cfat_CDsa...`（下午第二次） | 36dc817a | ❌ verify/zones/workers 全部 Invalid access token |

**结论：API、网络、token 格式（cfat_）都没有问题——问题锁定在 36dc817a 账户的两个 token 本身**（已吊销/创建异常/账户 API 权限被禁）。

## 请用户二选一

### 选项 X：继续修 36dc817a 账户

1. 浏览器登录该账户的 Cloudflare Dashboard
2. 头像 → My Profile → **API Tokens** → 看列表里这两个 token 的状态。若显示为已删除/过期 → 是吊销问题
3. **重新创建时注意**：不要从「R2 → 管理 S3 凭证」页签创建（那个入口创建的 token 权限经常只有 R2）。正确入口：My Profile → API Tokens → Create Token → 模板选 **"Edit Cloudflare Workers"** → Zone Resources 选 `jk93.qzz.io`（若已加入）
4. 创建完**先自己在浏览器测一下**：打开 `https://api.cloudflare.com/client/v4/accounts/36dc817a796a8f194ad1631a646d6762/workers/scripts`，页面提示登录就对了（返回 JSON 说明权限 OK）
5. 把新 token 发我，我继续绑 `myoa.jk93.qzz.io`

### 选项 Y：直接用可用账户（5ee5e384）

那个账户的 token 是好的、worker 也在里面跑。要绑 `myoa.jk93.qzz.io` 只需：

1. Dashboard（5ee5e384 账户）→ Websites → **Add Site** → 输入 `jk93.qzz.io`
2. CF 给出两个 NS（`aspen.ns.cloudflare.com` / `max.ns.cloudflare.com`）→ 到 qzz.io 面板改 NS（**免费二级域大概率不允许，先确认**）
3. NS 生效（zone active）后告诉我，我用现有 token 绑 custom domain + 切换站点代理地址

### 选项 Z：换 NAS Nginx（不依赖 CF 任何账户）

`myoa.jk93.qzz.io` A 记录已指向 CF IP——只需在 qzz.io 面板把它改成 NAS 公网 IP（或用 FRP/ngrok 临时验证），Nginx 配置已备好。你给我 NAS 域名或 IP 我立即适配。

## 当前不影响使用

- 站点当前是 mock 演示模式，全部页面可浏览，不影响 UI 验收。
- 真机联调可先用 ngrok/FRP 等把 NAS Nginx 暴露出来（路径 2 的最小验证版）。

---

# token 问题定案（13:52，共 5 枚 token 实验）

## 实验总表

| # | Token | 账户 | 类型 | 等待 | 结果 |
|---|---|---|---|---|---|
| 1 | `cfat_1dSXJ…` | 5ee5e384 | 截图给 | — | ✅ **200（跨 1 小时复测仍可用）** |
| 2 | `cfat_sguI2…` | 36dc817a | 截图给 | — | ❌ Invalid |
| 3 | `cfat_CDsa…`（截图版 53 字符） | 36dc817a | 截图给 | — | ❌ Invalid |
| 4 | `cfat_CDsa…`（文本版 51 字符，同源抄错） | 36dc817a | 文本给 | — | ❌ Invalid |
| 5 | `cfat_i15g…`（54 字符，全新前缀） | 36dc817a | 截图给 | +60s ×3 | ❌ Invalid |

## 定案结论

**排除抄写错误、排除生效延迟、排除 API/网络/token 格式问题（#1 全程可用证明）——36dc817a 账户是账户级的 API 认证异常**。该账户下创建的所有 token 都无法通过 `api.cloudflare.com` 认证。常见根因（按概率）：

1. **账户未完成邮箱验证 / 未激活**（免费账户注册后必须验证邮箱，未验证时 API 拒绝所有 token）
2. 账户被 CF 风控（新账户频繁创建/撤销 token）
3. 浏览器登录的账户与截图显示的账户 ID 不一致（多账户切换）

## 30 秒自测（浏览器做，不经过我）

1. 登录 `dash.cloudflare.com`，确认当前账户是 `36dc817a…`
2. 头像 → My Profile → **API Tokens**（左侧栏，不是 R2 页签）→ 看 token 状态是否 Active
3. 浏览器地址栏打开：`https://api.cloudflare.com/client/v4/accounts/36dc817a796a8f194ad1631a646d6762/workers/scripts`
   - 返回 `{"success":true...}` = token 好使，发我继续
   - 返回 `Authentication error` / 跳登录页 = 按 1-2 排查

## 强烈建议：改用可用账户走完

账户 5ee5e384 的 token 全好的、worker 也在里面跑。绑 `myoa.jk93.qzz.io` 只差：

1. Dashboard（5ee5e384 账户）→ Websites → **Add Site** → `jk93.qzz.io`
2. CF 分配 NS（`aspen/max.ns.cloudflare.com`）→ **到 qzz.io 面板改 NS**（免费二级域大概率不允许——这是唯一未知数，先确认）
3. NS 生效后我用可用 token 绑 custom domain，10 分钟完事

若 qzz.io 不准改 NS → 直接转 NAS Nginx：`myoa.jk93.qzz.io` A 记录改成 NAS 公网 IP，给我 IP 我立即适配。
