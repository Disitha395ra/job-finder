import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCalendar, FiBriefcase, FiFileText } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { applicationService } from '../services/jobService';
import Loader from '../components/ui/Loader';
import './ProfilePage.css';

const AppliedJobsPage = () => {
    const { currentUser, userType, getToken, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && (!currentUser || userType !== 'seeker')) {
            navigate('/login');
            return;
        }
        if (currentUser && userType === 'seeker') {
            fetchApplications();
        }
    }, [currentUser, userType, authLoading]);

    const fetchApplications = async () => {
        setLoading(true);
        try {
            const token = await getToken();
            const data = await applicationService.getUserApplications(token);
            setApplications(data);
        } catch (error) {
            toast.error('Failed to load applications.');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    if (authLoading) return <Loader />;

    return (
        <div className="profile-page">
            <button
                className="job-detail-back"
                onClick={() => navigate('/profile')}
                style={{ marginBottom: 'var(--space-lg)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.9rem' }}
            >
                <FiArrowLeft size={18} />
                Back to Profile
            </button>

            <div className="profile-card">
                <div className="profile-header" style={{ padding: 'var(--space-xl) var(--space-2xl)' }}>
                    <div className="profile-info" style={{ textAlign: 'left' }}>
                        <h1 style={{ fontSize: '1.3rem' }}>My Applied Jobs</h1>
                        <p style={{ opacity: 0.85 }}>Track all your job applications</p>
                    </div>
                </div>

                <div className="profile-body">
                    {loading ? (
                        <Loader />
                    ) : applications.length > 0 ? (
                        <div className="applied-jobs-list">
                            {applications.map((app) => (
                                <div
                                    key={app.id}
                                    className="applied-job-card"
                                    onClick={() => navigate(`/jobs/${app.jobId}`)}
                                >
                                    <div className="applied-job-header">
                                        <div>
                                            <h3 className="applied-job-title">{app.jobTitle}</h3>
                                            <span className="applied-job-company">{app.companyName}</span>
                                            <div className="applied-job-meta">
                                                <span>
                                                    <FiCalendar size={14} />
                                                    Applied {formatDate(app.createdAt)}
                                                </span>
                                                {app.cvUrl && (
                                                    <span>
                                                        <FiFileText size={14} />
                                                        CV attached
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <span className={`applied-job-status ${app.status}`}>
                                            {app.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="applied-empty">
                            <div className="applied-empty-icon"><FiBriefcase /></div>
                            <h3>No applications yet</h3>
                            <p>Start applying to jobs that match your skills and interests.</p>
                            <button
                                className="form-btn form-btn-primary"
                                style={{ maxWidth: '200px', margin: 'var(--space-md) auto 0' }}
                                onClick={() => navigate('/')}
                            >
                                Browse Jobs
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AppliedJobsPage;
