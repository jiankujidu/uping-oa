# 优品OA Web（双端版）

把「优品OA」Android APK（WebView 壳 + H5 业务）重做为**同时支持手机端与电脑端的网页应用**。

- 手机端：对原 APK H5 界面 1:1 还原（底部 4 Tab、网格首页、卡片列表、ActionSheet、下拉刷新）
- 电脑端：专业桌面重设计（左侧导航、表格、侧边详情、右键菜单、快捷键、批量操作）
- 单一代码库：Vite + Vue3 + TS + Pinia + Hash 路由 + 原生 CSS，产物纯静态，可部署 GitHub Pages

## 本地运行

```bash
npm install
npm run dev        # http://localhost:5173
```

## 构建与部署

```bash
npm run build      # 产物在 dist/（纯静态，约 3MB）
```

### GitHub Pages

1. 仓库 Settings → Pages → Source 选 **GitHub Actions**
2. 推送即自动部署（`.github/workflows/deploy.yml` 已配置）
3. `vite.config.ts` 的 `base: './'` 对仓库子路径（`user.github.io/repo/`）无 404 资源问题，无需改配置

### 连接真实 OA 后端（反代）

原 APK 直连 `https://oa.upingbio.cn`，该域名有 Referer 防盗链 + WAF，GitHub Pages 静态站无法直接跨域请求（OPTIONS 预检 403），必须薄反代：

| 方案 | 文件 | 状态 |
|---|---|---|
| A. Cloudflare Worker | `proxy/worker.js` + `proxy/wrangler.toml` | ✅ 已部署：`uping-oa-proxy.jiankujidu1.workers.dev`，但 **workers.dev 国内被断**，需绑自定义域（见 PROXY-DEPLOY.md） |
| B. NAS Nginx | `proxy/nginx.conf.example` | 最稳，依赖你的域名/DDNS |

```bash
cp .env.example .env
# .env 中 VITE_PROXY_BASE 填反代地址
npm run build
```

**运行时可切换**（不必重新构建）：浏览器控制台
`localStorage.setItem('upoa:proxy_base','https://你的反代地址')` 后刷新；清空该 key 回落。

**不配代理时应用照常运行**：自动降级为内置 mock 数据（来自真实接口响应脱敏），顶部显示黄色横幅提示，功能可完整走通。

**详见 [PROXY-DEPLOY.md](./PROXY-DEPLOY.md)**：workers.dev 阻断实测数据、自定义域绑定步骤、NS 切换操作。

## 双端测试方法

| 端 | 方式 |
|---|---|
| 手机布局 | DevTools 设备模拟（iPhone 12，390×844）或真机访问；<768px 生效 |
| 桌面布局 | ≥1024px + 精确指针（鼠标）；窗口缩到 768–1024 走平板=手机布局（表格在此区间被挤压，纵向卡片更舒适） |
| 触控交互 | DevTools 切 `pointer: coarse` 后长按列表项 → ActionSheet |
| 快捷键 | Ctrl+K 搜索 / Esc 关闭 / Delete 删除选中 |

## 数据与备份

- 数据默认全部来自 OA 后端（mock 模式下来自本地 mock）
- 「记住密码」用 Web Crypto AES-GCM 加密后存 localStorage，不存明文（原 APK 存明文，已修复）
- 桌面端支持一键导出 CSV/JSON（表格右上角）

## 已知降级（不砍入口）

| 原 APK 能力 | 网页端方案 |
|---|---|
| 后台 10s 消息轮询 | 页面打开期间轮询 + Web Notification + 震动；关页签即停，PWA 引导「加到主屏幕」 |
| 系统分享面板 | 手机 `navigator.share({files})`；桌面「下载 + 复制文件名」 |
| 调起 WPS/Word 打开 docx | 下载后用本地应用打开，按钮明示 |
| 拍照上传 | `input[type=file][capture]`，手机端自动切相机 |
| docx 在线编辑 | docx-preview 只读 + 本地生成 PDF；编辑降级为「下载原文件」提示 |
| 存入 Download/优品OA/ | 浏览器下载目录（路径不可控，已提示） |

## 安全说明

- 原 APK `mail_list`（通讯录）接口返回 `pwd` hash + `salt`，本应用 mock 数据已脱敏，前端不读取该字段
- 所有服务端 HTML 富文本渲染前过白名单消毒（`utils/sanitize.ts`），防 XSS
- 用户输入一律转义，无 `innerHTML` 直渲

## 目录

```
src/
  api/          HTTP 客户端（超时/重试/会话守卫/反代不可达自动切 mock）
  mock/         mock server + 真机响应脱敏数据
  shared/       双端共享业务组件 + 命令注册表 + 弹层三件套
  views/mobile/ 手机端 1:1 还原页面
  views/desktop/ 桌面端重设计页面
proxy/          反代部署文件（CF Worker / Nginx）
```
