import { useState } from 'react'
import '../css/login.css'

import { useAuth } from '../context/useAuth'

const IconUser = (props) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
    <path
      d="M12 12c2.761 0 5-2.239 5-5S14.761 2 12 2 7 4.239 7 7s2.239 5 5 5Z"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path
      d="M20 22a8 8 0 1 0-16 0"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
)

const IconLock = (props) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
    <path
      d="M7 11V8a5 5 0 0 1 10 0v3"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M6 11h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z"
      stroke="currentColor"
      strokeWidth="2"
    />
  </svg>
)

const IconEye = (props) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
    <path
      d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
)

const IconEyeOff = (props) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
    <path
      d="M10.58 10.58A2 2 0 0 0 12 14a2 2 0 0 0 1.42-.58"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M9.88 4.24A10.12 10.12 0 0 1 12 4c6.5 0 10 8 10 8a18.5 18.5 0 0 1-3.18 4.62"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M6.12 6.12C3.2 8.18 2 12 2 12s3.5 8 10 8c1.2 0 2.3-.2 3.3-.56"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M3 3l18 18"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
)

const LogoGoogle = (props) => (
  <svg viewBox="0 0 48 48" aria-hidden="true" {...props}>
    <path
      fill="#EA4335"
      d="M24 9.5c3.54 0 6.02 1.53 7.4 2.81l5.4-5.2C33.39 4.02 29.06 2 24 2 14.62 2 6.52 7.38 2.6 15.2l6.86 5.33C11.28 14.4 17.14 9.5 24 9.5z"
    />
    <path
      fill="#4285F4"
      d="M46 24.5c0-1.6-.14-2.78-.45-4.02H24v7.68h12.53c-.25 2.03-1.62 5.1-4.67 7.15l7.15 5.5C43.22 35.14 46 30.27 46 24.5z"
    />
    <path
      fill="#FBBC05"
      d="M9.46 28.64c-.48-1.42-.76-2.93-.76-4.48s.28-3.06.75-4.48L2.6 14.35C.96 17.65 0 21.35 0 24.16c0 2.81.96 6.51 2.6 9.81l6.86-5.33z"
    />
    <path
      fill="#34A853"
      d="M24 46c6.06 0 11.15-2 14.87-5.42l-7.15-5.5c-1.92 1.34-4.5 2.27-7.72 2.27-6.86 0-12.71-4.9-14.53-11.66L2.6 33.13C6.52 40.95 14.62 46 24 46z"
    />
    <path fill="none" d="M0 0h48v48H0z" />
  </svg>
)

const LogoMicrosoft = (props) => (
  <svg viewBox="0 0 48 48" aria-hidden="true" {...props}>
    <path fill="#F25022" d="M4 4h19v19H4z" />
    <path fill="#7FBA00" d="M25 4h19v19H25z" />
    <path fill="#00A4EF" d="M4 25h19v19H4z" />
    <path fill="#FFB900" d="M25 25h19v19H25z" />
  </svg>
)

const LogoApple = (props) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
    <path
      fill="currentColor"
      d="M16.56 13.17c.02 2.11 1.86 2.81 1.88 2.82-.01.05-.29.99-.95 1.96-.57.84-1.17 1.68-2.11 1.7-.93.02-1.23-.55-2.29-.55-1.06 0-1.39.53-2.27.57-.9.03-1.58-.9-2.16-1.73-1.18-1.71-2.08-4.83-.87-6.93.6-1.04 1.67-1.7 2.83-1.72.88-.02 1.71.59 2.29.59.57 0 1.65-.73 2.78-.62.47.02 1.79.19 2.64 1.43-.07.04-1.58.92-1.56 2.48ZM14.75 6.55c.48-.58.8-1.39.71-2.2-.69.03-1.52.46-2.01 1.04-.44.5-.83 1.32-.73 2.1.77.06 1.55-.39 2.03-.94Z"
    />
  </svg>
)

export default function Login({ onSuccess }) {
  const { login } = useAuth()
  const t = (_key, opts = {}) => opts?.defaultValue ?? ''
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [remember, setRemember] = useState(true)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login({ username: username.trim(), password, remember })
      onSuccess?.()
    } catch (err) {
      setError(err?.message || 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="sm-login">
      <div className="sm-login-shell">
        {/* <section className="sm-login-visual" aria-hidden="true">
          <img src={loginPageImg} alt="" />
        </section> */}
        <section className="sm-login-left">
          <div className="sm-login-brand">
            <div className="sm-login-logo" aria-hidden="true">
              <img src="/assets/images/logo-icon.png" alt="" />
            </div>
            <div>
              <div className="sm-login-brand-title">School Management</div>
              <div className="sm-login-brand-sub">Smart Education, Bright Future</div>
            </div>
          </div>

          <h1 className="sm-login-title">
            {t('login.welcome_back', { defaultValue: 'Welcome Back!' })}
          </h1>
          <p className="sm-login-subtitle">
            {t('login.subtitle', { defaultValue: 'Login to continue to your account' })}
          </p>

          <form className="sm-login-form" onSubmit={handleSubmit}>
            {error ? <div className="sm-login-error">{error}</div> : null}

            <div className="sm-login-field">
              <IconUser className="sm-login-icon" />
              <input
                className="sm-login-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t('login.username', { defaultValue: 'Username / Email' })}
                autoComplete="username"
              />
            </div>

            <div className="sm-login-field">
              <IconLock className="sm-login-icon" />
              <input
                className="sm-login-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('login.password', { defaultValue: 'Password' })}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="sm-login-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <IconEyeOff className="sm-login-eye" /> : <IconEye className="sm-login-eye" />}
              </button>
            </div>

            <div className="sm-login-row">
              <label className="sm-login-remember">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />{' '}
                {t('login.remember', { defaultValue: 'Remember me' })}
              </label>
              <button
                type="button"
                className="sm-login-link"
                onClick={() => setError('Password reset is not implemented yet.')}
              >
                {t('login.forgot_password', { defaultValue: 'Forgot Password?' })}
              </button>
            </div>

            <button className="sm-login-submit" type="submit" disabled={busy || !username.trim() || !password}>
              <span>
                {busy
                  ? t('login.logging_in', { defaultValue: 'Logging in...' })
                  : t('login.login', { defaultValue: 'Login' })}
              </span>
              
            </button>

            <div className="sm-login-divider" aria-hidden="true">
              <span>{t('login.or_continue', { defaultValue: 'or continue with' })}</span>
            </div>

            <div className="sm-login-social" aria-label="Social login (UI only)">
              <button type="button" className="sm-login-social-btn" onClick={() => setError('Social login is not implemented yet.')}>
                <LogoGoogle className="sm-login-social-logo" />
              </button>
              <button type="button" className="sm-login-social-btn" onClick={() => setError('Social login is not implemented yet.')}>
                <LogoMicrosoft className="sm-login-social-logo" />
              </button>
              <button type="button" className="sm-login-social-btn" onClick={() => setError('Social login is not implemented yet.')}>
                <LogoApple className="sm-login-social-apple" />
              </button>
            </div>

            <div className="sm-login-signup">
              <span>{t('login.no_account', { defaultValue: "Don't have an account?" })}</span>{' '}
              <button type="button" className="sm-login-link " onClick={() => setError('Create account is not implemented yet.')}>
                {t('login.create_account', { defaultValue: 'Create Account' })}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}
