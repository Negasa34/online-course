export const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '')

export async function apiRequest(path, { token, ...options } = {}) {
  let response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        ...(options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    })
  } catch {
    throw new Error('Could not connect to LearnHub. Check that the course server is running.')
  }

  let body
  try {
    body = await response.json()
  } catch {
    throw new Error('The server returned an unreadable response.')
  }

  if (!response.ok || body.success === false) {
    const error = new Error(body.message || 'Something went wrong. Please try again.')
    error.status = response.status
    throw error
  }
  return body
}
