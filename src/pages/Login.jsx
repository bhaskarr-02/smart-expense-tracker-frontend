import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { loginUser } from '../services/ApiService'
import { useTheme } from '../context/ThemeContext'

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { dark, toggleTheme } = useTheme()

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!form.username || !form.password) { setError('All fields required.'); return }
    setLoading(true)
    try {
      const res = await loginUser(form)
      localStorage.setItem('userId', res.data.userId)
      localStorage.setItem('username', res.data.username)
      localStorage.setItem('email', res.data.email)
      navigate('/dashboard')
    } catch (err) { setError(err.response?.data?.error || 'Invalid credentials.') }
    finally { setLoading(false) }
  }

  return (
    <div className="auth-bg">
      <button className="theme-btn-abs" onClick={toggleTheme}>{dark ? '☀️' : '🌙'}</button>
      <div className="auth-card">
        <div className="auth-icon">💰</div>
        <h2>Smart Expense Tracker</h2>
        <p className="auth-sub">Sign in to your account</p>
        {error && <div className="alert alert-err">{error}</div>}
        <form onSubmit={onSubmit}>
          <div className="field"><label>Username</label>
            <input name="username" type="text" placeholder="Enter username"
              value={form.username} onChange={e => setForm({...form, username: e.target.value})} /></div>
          <div className="field"><label>Password</label>
            <input name="password" type="password" placeholder="Enter password"
              value={form.password} onChange={e => setForm({...form, password: e.target.value})} /></div>
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p className="auth-footer">No account? <Link to="/register">Register here</Link></p>
      </div>
    </div>
  )
}
