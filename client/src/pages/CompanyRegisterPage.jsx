import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiBriefcase, FiMail, FiLock, FiUserPlus, FiFileText } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/ui/Loader';
import '../components/auth/AuthForms.css';

const CompanyRegisterPage = () => {
    const { registerCompany } = useAuth();
    const navigate = useNavigate();

    const [companyName, setCompanyName] = useState('');
    const [email, setEmail] = useState('');
    const [description, setDescription] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!companyName.trim() || !email.trim() || !password || !confirmPassword) {
            setError('Please fill in all required fields.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        setLoading(true);
        try {
            await registerCompany(email, password, companyName, description);
            toast.success('Company registered! Check your email for verification.');
            navigate('/company/dashboard', { replace: true });
        } catch (err) {
            if (err.code === 'auth/email-already-in-use') {
                setError('Email is already registered.');
            } else {
                setError('Registration failed. Please try again.');
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
                        <h1>Register Company</h1>
                        <p>Start posting jobs and finding talent</p>
                    </div>

                    {error && <div className="alert alert-error">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="company-name">Company Name *</label>
                            <input
                                id="company-name"
                                className="form-input"
                                type="text"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                placeholder="Acme Inc."
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="company-email">Company Email *</label>
                            <input
                                id="company-email"
                                className="form-input"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="hr@company.com"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="company-desc">Company Description</label>
                            <textarea
                                id="company-desc"
                                className="form-input form-textarea"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Tell us about your company..."
                                rows={3}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="company-pass">Password *</label>
                            <input
                                id="company-pass"
                                className="form-input"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Min. 6 characters"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="company-confirm">Confirm Password *</label>
                            <input
                                id="company-confirm"
                                className="form-input"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Repeat your password"
                                required
                            />
                        </div>

                        <button type="submit" className="form-btn form-btn-primary" disabled={loading}>
                            {loading ? <Loader inline text="Registering..." /> : <><FiUserPlus size={18} /> Register Company</>}
                        </button>
                    </form>

                    <div className="auth-footer">
                        <p>
                            Already registered? <Link to="/company/login">Sign in</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CompanyRegisterPage;
