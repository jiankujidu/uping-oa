import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import { defineAsyncComponent } from 'vue'

/**
 * 双端路由包装：同一 URL，桌面/手机渲染不同布局组件。
 * 布局壳（MobileLayout / DesktopLayout）与页面都走 dual，保证同一 URL 双端自适应。
 */
function dual(mobile: () => Promise<any>, desktop: () => Promise<any>): () => Promise<any> {
  let m: any, d: any
  return async () => {
    const mod = await import('@/layouts/DeviceSwitch.vue')
    if (!m) m = defineAsyncComponent(mobile)
    if (!d) d = defineAsyncComponent(desktop)
    return { default: mod.default, props: { default: { mobile: m, desktop: d } } }
  }
}

const routes: RouteRecordRaw[] = [
  { path: '/login', component: () => import('@/views/LoginView.vue'), meta: { public: true } },
  {
    path: '/',
    component: dual(() => import('@/views/mobile/MobileLayout.vue'), () => import('@/layouts/DesktopLayout.vue')),
    children: [
      { path: '', redirect: 'home' },
      { path: 'home', component: dual(() => import('@/views/mobile/HomeTab.vue'), () => import('@/views/desktop/DesktopHome.vue')) },
      { path: 'approve', component: dual(() => import('@/views/mobile/ApproveTab.vue'), () => import('@/views/desktop/DesktopApprove.vue')) },
      { path: 'customer', component: dual(() => import('@/views/mobile/CustomerTab.vue'), () => import('@/views/desktop/DesktopCustomer.vue')) },
      { path: 'mine', component: dual(() => import('@/views/mobile/MineTab.vue'), () => import('@/views/desktop/DesktopMine.vue')) },
      // 35 种子页：/p/note /p/order-my /p/message-inbox /p/product ...
      { path: 'p/:type', component: dual(() => import('@/views/mobile/SubPageView.vue'), () => import('@/views/desktop/DesktopSubPage.vue')) },
      // 详情壳：/detail/approve/3175 /detail/order/123 /detail/sales-agreement/99 ...
      { path: 'detail/:kind/:id', component: dual(() => import('@/views/mobile/DetailView.vue'), () => import('@/views/desktop/DesktopDetail.vue')) }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

router.beforeEach((to) => {
  const logged = !!localStorage.getItem('upoa:logged')
  if (!to.meta.public && !logged) return { path: '/login', query: { redirect: to.fullPath } }
  if (to.path === '/login' && logged) return { path: '/home' }
  return true
})

// 调试：导航失败/重定向循环诊断（上线后可移除）
router.afterEach((to, _from, failure) => {
  if (failure) console.warn('[router-failure]', to.fullPath, failure.type, failure.message || '')
})
router.onError((e) => console.warn('[router-error]', e))

export default router
