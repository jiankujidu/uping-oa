import { defineStore } from 'pinia'
import { ref } from 'vue'
import { API } from '@/api/endpoints'
import { onSessionExpired } from '@/api/client'
import { loadSavedUser, clearSavedUser, saveUserCrypto } from '@/utils/session'

interface LoginUser {
  uid: number
  username: string
  name: string
  [k: string]: any
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<LoginUser | null>(null)
  const loggingIn = ref(false)
  const error = ref('')

  function isLoggedIn() { return !!user.value }

  async function login(username: string, password: string, captcha: string, remember: boolean) {
    loggingIn.value = true
    error.value = ''
    try {
      const r = await API.login(username, password, captcha)
      if (r && r.code === 0) {
        user.value = { uid: r.data?.uid || 0, username, name: username }
        localStorage.setItem('upoa:logged', '1')
        localStorage.setItem('upoa:username', username)
        if (remember) {
          try { await saveUserCrypto(username, password) } catch { /* 加密失败不阻塞登录 */ }
        } else {
          clearSavedUser()
        }
        return true
      }
      error.value = (r && r.msg) || '登录失败'
      return false
    } catch (e: any) {
      error.value = e?.message || '网络错误'
      return false
    } finally {
      loggingIn.value = false
    }
  }

  /** 用本地记住的账号预填登录页 */
  async function prefill() { return await loadSavedUser() }

  function logout() {
    user.value = null
    clearSavedUser()
    localStorage.removeItem('upoa:logged')
    localStorage.removeItem('upoa:username')
  }

  function onExpired() {
    user.value = null
    error.value = '登录已失效，请重新登录'
  }

  onSessionExpired(onExpired)

  return { user, loggingIn, error, isLoggedIn, login, logout, prefill, onExpired }
})
