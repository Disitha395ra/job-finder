import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import JobDetailPage from './pages/JobDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import AppliedJobsPage from './pages/AppliedJobsPage';
import CompanyLoginPage from './pages/CompanyLoginPage';
import CompanyRegisterPage from './pages/CompanyRegisterPage';
import CompanyDashboard from './pages/CompanyDashboard';
import { FiHome } from 'react-icons/fi';
import './App.css';

const NotFoundPage = () => (
    <div className="not-found-page">
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>The page you're looking for doesn't exist or has been moved.</p>
        <Link to="/" className="not-found-btn">
            <FiHome size={18} />
            Back to Home
        </Link>
    </div>
);

function App() {
    return (
        <Router>
            <AuthProvider>
                <div className="app-layout">
                    <Navbar />
                    <main className="app-main">
                        <Routes>
                            {/* Public Routes */}
                            <Route path="/" element={<HomePage />} />
                            <Route path="/jobs/:id" element={<JobDetailPage />} />

                            {/* Job Seeker Auth */}
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/register" element={<RegisterPage />} />

                            {/* User Profile */}
                            <Route path="/profile" element={<ProfilePage />} />
                            <Route path="/profile/applied-jobs" element={<AppliedJobsPage />} />

                            {/* Company Auth */}
                            <Route path="/company/login" element={<CompanyLoginPage />} />
                            <Route path="/company/register" element={<CompanyRegisterPage />} />

                            {/* Company Dashboard */}
                            <Route path="/company/dashboard" element={<CompanyDashboard />} />

                            {/* 404 */}
                            <Route path="*" element={<NotFoundPage />} />
                        </Routes>
                    </main>
                    <Footer />
                </div>

                <ToastContainer
                    position="top-right"
                    autoClose={4000}
                    hideProgressBar={false}
                    newestOnTop
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                    theme="colored"
                />
            </AuthProvider>
        </Router>
    );
}

export default App;
