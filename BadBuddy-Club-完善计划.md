# BadBuddy Web Club 完善计划

**基于测试报告生成** — 2026-02-13  
**当前版本通过率：** 88.3% → 目标 95%+

---

## 🔴 Phase 1: 已完成的修复 (本次)

| # | 问题 | 修复 | 状态 |
|---|------|------|------|
| BUG-1 | PATCH /v1/me 不保存 gender/dateOfBirth | 添加字段到解构和更新逻辑 | ✅ |
| BUG-2 | 登录页 redirect 参数被 isAuthenticated useEffect 覆盖 | useEffect 使用 redirect 变量 | ✅ |
| BUG-3 | AppLayout 未认证跳转不保留当前路径 | 添加 `?redirect=` 到 login URL | ✅ |
| ISSUE-4 | 审计日志 Mock 返回空数据 | 实现真实审计日志记录+查询+分页 | ✅ |
| ISSUE-6 | 邀请自动接受在 StrictMode 下双重触发 | 添加 useRef guard | ✅ |
| ISSUE-7 | 通用邀请接受只创建申请不创建成员 | 改为直接创建成员 | ✅ |
| UI-1 | 俱乐部创建页面风格不统一 | 添加 gradient header | ✅ |

---

## 🟡 Phase 2: 短期改进 (建议 1-2 天)

### 2.1 前端功能完善

#### P2-1: 注册页面状态持久化
- **问题：** 多步骤注册表单刷新后回到第一步
- **方案：** 使用 `sessionStorage` 保存表单数据和当前步骤
- **文件：** `src/app/(auth)/register/page.tsx`
- **工作量：** 0.5h

#### P2-2: 注册页面步骤指示器动画
- **问题：** 步骤切换没有过渡动画
- **方案：** 添加 `framer-motion` 或 CSS transition 动画
- **文件：** `src/app/(auth)/register/page.tsx`
- **工作量：** 1h

#### P2-3: OTP 输入框响应式优化
- **问题：** 6个输入框在小屏幕可能溢出
- **方案：** 在 <375px 屏幕上缩小输入框尺寸
- **文件：** `src/app/(auth)/login/page.tsx`, `src/app/(auth)/register/page.tsx`
- **工作量：** 0.5h

#### P2-4: 统一 Loading Skeleton 组件
- **问题：** 各页面 loading 实现不一致
- **方案：** 创建 `src/components/skeletons.tsx` 统一 skeleton 组件
- **文件：** 新建 + 各页面引用
- **工作量：** 1h

#### P2-5: 俱乐部搜索增强
- **问题：** 搜索只支持名称模糊匹配
- **方案：** 添加 type, joinMode 筛选 dropdown
- **文件：** `src/app/(app)/dashboard/page.tsx`, Mock API
- **工作量：** 1.5h

### 2.2 Mock API 完善

#### P2-6: 更多操作添加审计日志
- **当前已记录：** 邀请接受、申请审批/拒绝
- **需要添加：** 俱乐部创建/更新/删除、成员角色变更、成员移除、邀请创建/撤销
- **文件：** 各相关 API route
- **工作量：** 1h

#### P2-7: 邀请过期机制
- **问题：** 邀请没有自动过期
- **方案：** 邀请添加 `expiresAt` 字段，预览/接受时检查
- **文件：** `src/app/api/v1/clubs/[clubId]/invites/route.ts` + 相关
- **工作量：** 0.5h

#### P2-8: 成员限制检查
- **问题：** `activeMemberLimit` 设置了但不检查
- **方案：** 在邀请接受和申请审批时检查成员数量
- **文件：** invite accept + application approve routes
- **工作量：** 0.5h

---

## 🟢 Phase 3: 中期改进 (建议 3-5 天)

### 3.1 新功能开发

#### P3-1: 图片上传功能
- **范围：** 用户头像 + 俱乐部 badge
- **方案：**
  1. 创建 Mock 图片存储 (base64 存入 DB 或本地文件)
  2. 添加 `POST /v1/upload` API endpoint
  3. 创建 `ImageUpload` 组件 (裁剪 + 预览)
  4. 集成到 Profile 页面和 Club Settings
- **工作量：** 4h

#### P3-2: 地图位置选择
- **范围：** 俱乐部创建/编辑时选择位置
- **方案：**
  1. 集成 Google Maps / Mapbox SDK
  2. 创建 `LocationPicker` 组件
  3. 在 Club 创建/设置页面集成
  4. Dashboard 搜索支持距离筛选
- **工作量：** 6h

#### P3-3: 邀请通知系统
- **范围：** 被邀请人收到通知
- **方案：**
  1. 添加 `notifications` 表到 Mock DB
  2. 创建通知 API endpoints
  3. Navbar 添加通知铃铛 + 未读计数
  4. 通知下拉面板
- **工作量：** 4h

#### P3-4: 俱乐部活动/赛事模块
- **范围：** 创建活动、报名、签到
- **方案：**
  1. 数据模型: events, registrations
  2. CRUD API endpoints
  3. Club detail 新 tab: Events
  4. 活动详情页 + 报名功能
- **工作量：** 8h

### 3.2 用户体验优化

#### P3-5: 暗色模式支持
- **方案：** 使用 `next-themes` + shadcn/ui 暗色变量
- **文件：** `tailwind.config.ts`, `providers.tsx`, Navbar toggle
- **工作量：** 2h

#### P3-6: 国际化 (i18n)
- **范围：** 中英文切换
- **方案：** 使用 `next-intl` 或手动 context
- **工作量：** 4h (基础框架) + 持续翻译

#### P3-7: PWA 支持
- **范围：** 可安装到手机主屏幕
- **方案：** 添加 `manifest.json` + service worker
- **工作量：** 2h

---

## 🔵 Phase 4: 长期目标 (持续迭代)

### 4.1 测试自动化
- [ ] 添加 Vitest 单元测试框架
- [ ] API Mock 函数单元测试
- [ ] 关键 UI 组件测试 (PhoneInput, Navbar)
- [ ] Playwright E2E 测试 (注册→登录→创建俱乐部→邀请→接受)

### 4.2 性能优化
- [ ] React.memo / useMemo 优化重渲染
- [ ] API 请求去重 (SWR / React Query)
- [ ] 图片懒加载 + WebP 格式
- [ ] Bundle 分析 + tree shaking

### 4.3 部署准备
- [ ] 切换到 Sandbox API 测试
- [ ] 环境变量配置 (staging/production)
- [ ] Vercel / Netlify 部署配置
- [ ] 监控 + 错误追踪 (Sentry)

### 4.4 安全加固
- [ ] Rate limiting middleware
- [ ] CSRF token 验证
- [ ] Content Security Policy headers
- [ ] API 请求签名验证

---

## 📊 优先级矩阵

```
        高影响
          │
    P3-1  │  P2-1  BUG-1✅  BUG-2✅  BUG-3✅
    P3-4  │  P2-5  ISSUE-4✅
          │  P2-8
──────────┼──────────
    P3-2  │  P2-2  P2-3  P2-4
    P3-6  │  P2-6  P2-7
    P3-5  │  ISSUE-6✅
          │
        低影响
   高工作量        低工作量
```

---

## 🗓️ 建议时间线

| 阶段 | 时间 | 内容 |
|------|------|------|
| Phase 1 | ✅ 已完成 | 7个 bug/issue 修复 |
| Phase 2 | Day 1-2 | 前端完善 + Mock API 增强 |
| Phase 3 | Day 3-7 | 图片上传、地图、通知、活动模块 |
| Phase 4 | 持续 | 测试自动化、性能优化、部署准备 |

---

**下一步行动：** 从 Phase 2 的 P2-1 (注册状态持久化) 和 P2-8 (成员限制检查) 开始
