import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer-grid">
                <div className="footer-brand">
                    <h3>JobFinder</h3>
                    <p>
                        Find your dream job or the perfect candidate. Connecting talent with opportunity since 2024.
                    </p>
                </div>

                <div className="footer-column">
                    <h4>For Job Seekers</h4>
                    <Link to="/">Browse Jobs</Link>
                    <Link to="/login">Sign In</Link>
                    <Link to="/register">Create Account</Link>
                </div>

                <div className="footer-column">
                    <h4>For Employers</h4>
                    <Link to="/company/login">Company Login</Link>
                    <Link to="/company/register">Register Company</Link>
                    <Link to="/company/dashboard">Post a Job</Link>
                </div>

                <div className="footer-column">
                    <h4>Resources</h4>
                    <a href="#" onClick={(e) => e.preventDefault()}>Help Center</a>
                    <a href="#" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
                    <a href="#" onClick={(e) => e.preventDefault()}>Terms of Service</a>
                </div>
            </div>

            <div className="footer-bottom">
                <p>&copy; {new Date().getFullYear()} JobFinder. All rights reserved.</p>
            </div>
        </footer>
    );
};

export default Footer;
