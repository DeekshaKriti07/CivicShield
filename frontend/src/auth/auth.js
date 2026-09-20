const TOKEN_KEY = 'civicshield_access_token'
const USER_KEY = 'civicshield_user'

export function saveAuth(data) {
  sessionStorage.setItem(TOKEN_KEY, data.access_token)

  sessionStorage.setItem(
    USER_KEY,
    JSON.stringify({
      username: data.username,
      role: data.role,
    })
  )
}

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY)
}

export function getUser() {
  const user = sessionStorage.getItem(USER_KEY)
  if (!user) return null

  try {
    return JSON.parse(user)
  } catch {
    return null
  }
}

export function isAuthenticated() {
  return Boolean(getToken())
}

export function logout() {
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(USER_KEY)
}
