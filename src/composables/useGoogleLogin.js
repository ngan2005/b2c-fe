/**
 * Redirect the browser to the backend's OAuth2 authorization endpoint.
 * Spring Security handles the dance and 302s back to /oauth/callback
 * (configured in the backend) with the JWT pair in the URL fragment.
 *
 * Used by both LoginView and RegisterView so users have a single
 * "sign in with Google" / "sign up with Google" path on either screen —
 * the backend resolves whether to re-login, link-by-email, or create a
 * new BUYER account.
 */
export function useGoogleLogin() {
  function loginWithGoogle() {
    const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:8080'
    const origin = new URL(apiBase).origin
    window.location.href = `${origin}/oauth2/authorization/google`
  }

  return { loginWithGoogle }
}