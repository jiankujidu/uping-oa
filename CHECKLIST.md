# 交付自检清单

## A. 手机端还原度对比（实现 vs 原 APK 源码）

> 验收基准：原 APK H5（`assets/www/js/app.js` 5674 行 + `css/style.css`）。无用户截图，以下按源码 DOM 结构与 CSS 逐值还原。

| # | 页面/组件 | 原 APK 实现 | 本实现 | 差异 |
|---|---|---|---|---|
| 1 | 登录页 | 蓝色顶栏 + Logo + 账号/密码/算式验证码 + 记住密码 | LoginView.vue 完全一致（算式验证码接 `/captcha.html`） | 验证码图片需反代跨域可读（已标明） |
| 2 | 首页 | 蓝色渐变头部 + 工作台横滑卡 + 4 类快捷审批 + 九宫格 18 入口 + 消息铃铛 | HomeTab.vue | — |
| 3 | 审批 Tab | 全部/待办/已办/已拒绝 4 段 Tab + 卡片列表 + 空态插画 | ApproveTab.vue | — |
| 4 | 客户 Tab | 我的/公海/废弃 3 段 Tab + 搜索 + 筛选漏斗 + 卡片 | CustomerTab.vue | — |
| 5 | 我的 Tab | 头像卡片 + 基本资料/修改密码/退出 | MineTab.vue | — |
| 6 | 底部导航 | 4 Tab（首页/审批/客户/我的），选中 #1E6FFF | MobileLayout.vue | — |
| 7 | 审批详情 | 头部 + 状态条 + 表单区 + 流转记录 + 附件 | ApproveDetailPage.vue | — |
| 8 | 审批表单 | 24 类表单元数据（`approve_meta.js` 原值生成 TS） | ApproveFormPage.vue + approveTypes.ts | 流程选择/抄送/附件上传全保留 |
| 9 | 客户详情 | 基础信息 + 联系人/商机/跟进/订单 4 子页 | CustomerDetailPage.vue | 原 APK 5 Tab（基础单列）→ 本实现子页签，功能项不砍 |
| 10 | 订单详情 | 打款公司 + 收货三级联动 + 产品明细 + 附件 + 合同区 | OrderDetailPage.vue | — |
| 11 | 消息中心 | 收件箱/发件箱/草稿/回收站 4 列表 + 详情 + 写消息 | MessagePage/MessageDetailPage/ComposePage | — |
| 12 | 产品/附件/财务/平台订单等 35 子页 | `subPages.ts` 配置表逐页对应 | SubPageView.vue 通用壳 + 专项详情 | — |
| 13 | 销售协议 docx | docx-preview 只读 + jspdf 生 PDF + 下载/转发 | SalesAgreementPage.vue + DocPreview.vue | 编辑降级为下载（原 APK 本地存 base64，能力也不完整） |
| 14 | 弹层 | ActionSheet / Toast / Confirm | shared/ 三件套组件库 | 从原生风格重绘为同视觉 CSS |
| 15 | 下拉刷新 | 顶部下拉转圈 | usePullRefresh.ts + 桌面刷新按钮 | — |
| 16 | 空/加载/错误态 | 文案 + 灰色插画占位 | EmptyState.vue / Skeleton.vue | 无插画素材，用骨架 + 图标占位 |
| 17 | design token | style.css 逐值提取 | styles/tokens.css | 主色 #1E6FFF、圆角、字号、间距、阴影全部对齐 |

## B. 电脑端功能对等检查清单

| 原 APK 功能（手机入口） | 桌面端等价 | 状态 |
|---|---|---|
| 底部 4 Tab | 左侧导航（分组：OA/客户/财务/工具） | ✅ |
| 九宫格 18 入口 | DesktopHome 应用宫格 + Ctrl+K 直达 | ✅ |
| 审批列表卡片 | DataTable 表格（排序/筛选/分页/行选） | ✅ |
| 点击详情（整页跳转） | 行点击 → 右侧详情面板（复用手机详情组件 + 桌面容器） | ✅ |
| 长按卡片菜单 | 右键上下文菜单 | ✅ |
| 底部 ActionSheet | 居中模态框 / 悬浮面板 | ✅ |
| 批量操作栏 | 多选后表格顶部批量栏（导出 CSV/JSON/删除） | ✅ |
| 消息中心 | 三栏延伸布局（列表占满 + 详情面板） | ✅ |
| 通讯录选人 | UserPicker 组件双端共用 | ✅ |
| 附件上传 | AttachmentUpload 桌面端支持拖拽 | ✅ |
| docx 预览 | 模态框 + 工具栏（PDF/下载/打印/复制） | ✅ |
| 记住密码 | 同手机端，AES-GCM 加密 | ✅ |
| 退出登录 | 顶栏用户菜单 | ✅ |

## C. 功能覆盖（113 项编号）

F001–F005 账号（登录/会话守卫/退出/资料/改密）
F010–F014 首页（工作台/网格/快捷审批/桌面版OA跳转/铃铛）
F020–F025 审批（列表/详情/24类表单/流程/附件/通过驳回撤回）
F030–F036 客户（三态/筛选/新增/详情4子页/转公海/转移/编辑）
F040–F046 订单（申请/处理/详情/审单/改单/删除/销售协议）
F047 平台订单 / F050–F055 财务 5 类 / F060–F064 产品（含说明书 PDF/收藏）
F070–F074 附件 / F080–F084 消息（4箱/详情/写消息/删除恢复/通讯录）
F090–F095 客户子业务 / F100 问答 / F101 公告 / F102 AI 助手 / F103 意见反馈
F104 校展（我处理的）/ F105 帮助中心

**入口 0 裁剪**：不可实现项（后台轮询/系统分享/拍照/docx 编辑/存储路径）全部以降级呈现在 UI 中。

## D. 部署前最后确认

- [x] `vue-tsc` 0 错误
- [x] `npm run build` 通过（dist/ 3.2MB 纯静态）
- [x] base `./` → 子路径部署无 404
- [x] Hash 路由 → 刷新不 404
- [x] vendor 本地化（docx-preview/pdf.js/jszip/mammoth/html2canvas/jspdf）0 CDN
- [x] PWA manifest + SW + 图标
- [x] GitHub Actions 自动部署配置
- [x] mock 降级横幅（代理未部署时）
- [x] 最终冒烟：main chunk 141KB、43 个资源 chunk、mock server/审批元数据/PWA 图标全部在场
- [x] 修复 mock 两个 bug：接口名下划线（mail_list）匹配失败、翻页重复灌数据
- [ ] 真实浏览器渲染验证：沙盒 Chromium 无法启动（agent-browser daemon 两次超时），建议本地 `npm run dev` 过一眼双端
- [ ] ⚠️ **GitHub token 未收到**（用户提到给过但历史会话与环境变量均未找到）——拿到后即可 `git push` 自动部署
- [ ] ⚠️ 反代未部署（CF Worker / Nginx 二选一）——部署前先用 mock 模式验证功能
