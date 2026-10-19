/**
 * 会话本地存储 —— “记住账号密码”的安全实现。
 * 原 APK 明文存 localStorage.uping_saved_user（明文密码，有泄露风险）。
 * 这里改为 Web Crypto AES-GCM：密钥由 PBKDF2 从固定口令派生，仅提高本地窃取成本，
 * 不具备对抗本机恶意代码的能力，但不再以明文落盘。
 */
const KEY_NAME = 'upoa:saved-user'
const PBKDF2_PASS = 'upoa-local-vault-2026'

let cryptoKey: CryptoKey | null = null

async function getKey(): Promise<CryptoKey> {
  if (cryptoKey) return cryptoKey
  const enc = new TextEncoder()
  const material = await crypto.subtle.importKey('raw', enc.encode(PBKDF2_PASS), 'PBKDF2', false, ['deriveKey'])
  cryptoKey = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: enc.encode('upoa-salt'), iterations: 50000, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
  return cryptoKey
}

export async function saveUserCrypto(username: string, password: string): Promise<void> {
  const key = await getKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const enc = new TextEncoder().encode(JSON.stringify({ u: username, p: password }))
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc)
  const payload = {
    iv: btoa(String.fromCharCode(...iv)),
    data: btoa(String.fromCharCode(...new Uint8Array(cipher)))
  }
  localStorage.setItem(KEY_NAME, JSON.stringify(payload))
}

export async function loadSavedUser(): Promise<{ username: string; password: string } | null> {
  try {
    const raw = localStorage.getItem(KEY_NAME)
    if (!raw) return null
    const { iv, data } = JSON.parse(raw)
    const key = await getKey()
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: Uint8Array.from(atob(iv), c => c.charCodeAt(0)) },
      key,
      Uint8Array.from(atob(data), c => c.charCodeAt(0))
    )
    const o = JSON.parse(new TextDecoder().decode(plain))
    return o && o.u ? { username: o.u, password: o.p || '' } : null
  } catch { return null }
}

export function clearSavedUser() { localStorage.removeItem(KEY_NAME) }
