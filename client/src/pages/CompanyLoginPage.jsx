import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiMail, FiLock, FiLogIn } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/ui/Loader';
import '../components/auth/AuthForms.css';

const CompanyLoginPage = () => {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!email.trim() || !password) {
            setError('Please fill in all fields.');
            return;
        }

        setLoading(true);
        try {
            await login(email, password);
            toast.success('Welcome to your company dashboard!');
            navigate('/company/dashboard', { replace: true });
        } catch (err) {
            const code = err.code;
            if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
                setError('Invalid email or password.');
            } else {
                setError('Login failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <h1>Company Login</h1>
                        <p>Access your employer dashboard</p>
                    </div>

                    {error && <div className="alert alert-error">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="company-login-email">Company Email</label>
                            <input
                                id="company-login-email"
                                className="form-input"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="company@example.com"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="company-login-password">Password</label>
                            <input
                                id="company-login-password"
                                className="form-input"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button type="submit" className="form-btn form-btn-primary" disabled={loading}>
                            {loading ? <Loader inline text="Signing in..." /> : <><FiLogIn size={18} /> Sign In</>}
                        </button>
                    </form>

                    <div className="auth-footer">
                        <p>
                            New company? <Link to="/company/register">Register here</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CompanyLoginPage;
