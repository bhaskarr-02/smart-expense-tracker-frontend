import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { registerUser } from '../services/ApiService'

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const h = (e) => setForm({...form, [e.target.name]: e.target.value})

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!form.username||!form.email||!form.password||!form.confirm) { setError('All fields required.'); return }
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return }
    if (form.password.length < 6) { setError('Password min 6 chars.'); return }
    setLoading(true)
    try {
      await registerUser({ username: form.username, email: form.email, password: form.password })
      setSuccess('Account created! Redirecting...')
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) { setError(err.response?.data?.error || 'Registration failed.') }
    finally { setLoading(false) }
  }

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <div className="auth-icon">📝</div>
        <h2>Create Account</h2>
        <p className="auth-sub">Join Smart Expense Tracker</p>
        {error && <div className="alert alert-err">{error}</div>}
        {success && <div className="alert alert-ok">{success}</div>}
        <form onSubmit={onSubmit}>
          {['username','email','password','confirm'].map(n => (
            <div className="field" key={n}>
              <label>{n.charAt(0).toUpperCase()+n.slice(1)}</label>
              <input name={n} type={n.includes('pass')||n==='confirm'?'password':n==='email'?'email':'text'}
                placeholder={n==='confirm'?'Repeat password':n==='password'?'Min 6 chars':'Enter '+n}
                value={form[n]} onChange={h} />
            </div>
          ))}
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>
        <p className="auth-footer">Have account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  )
}
