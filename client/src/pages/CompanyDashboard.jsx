import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FiPlus, FiBriefcase, FiSettings, FiMapPin, FiClock, FiUsers, FiTrash2,
    FiCalendar, FiDownload, FiMail, FiPhone, FiFileText, FiChevronDown, FiChevronUp, FiExternalLink,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { jobService, applicationService, companyService } from '../services/jobService';
import Loader from '../components/ui/Loader';
import '../components/auth/AuthForms.css';
import './CompanyDashboard.css';

const CompanyDashboard = () => {
    const { currentUser, userProfile, userType, getToken } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('jobs');
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    // Applicants state
    const [expandedJobId, setExpandedJobId] = useState(null);
    const [applicants, setApplicants] = useState({});
    const [loadingApplicants, setLoadingApplicants] = useState(null);
    const [downloadingCVs, setDownloadingCVs] = useState(null);

    // Post Job form
    const [postForm, setPostForm] = useState({
        title: '', description: '', location: '', jobType: 'Full-time',
        salary: '', keywords: '', cvLink: '', closingDate: '',
    });
    const [posting, setPosting] = useState(false);

    // Change Password
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);

    useEffect(() => {
        if (!currentUser || userType !== 'company') {
            navigate('/company/login');
            return;
        }
        fetchJobs();
    }, [currentUser, userType]);

    const fetchJobs = async () => {
        setLoading(true);
        try {
            const token = await getToken();
            const data = await companyService.getCompanyJobs(token);
            setJobs(data);
        } catch (error) {
            console.error('Error fetching jobs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePostJob = async (e) => {
        e.preventDefault();

        if (!postForm.title.trim() || !postForm.description.trim() || !postForm.location.trim()) {
            toast.error('Title, description, and location are required.');
            return;
        }

        setPosting(true);
        try {
            const token = await getToken();
            const keywords = postForm.keywords
                .split(',')
                .map((k) => k.trim())
                .filter(Boolean);

            await jobService.createJob(
                { ...postForm, keywords },
                token
            );

            toast.success('Job published successfully!');
            setPostForm({
                title: '', description: '', location: '', jobType: 'Full-time',
                salary: '', keywords: '', cvLink: '', closingDate: '',
            });
            setActiveTab('jobs');
            fetchJobs();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to publish job.');
        } finally {
            setPosting(false);
        }
    };

    const handleDeleteJob = async (jobId) => {
        if (!window.confirm('Are you sure you want to delete this job post?')) return;

        try {
            const token = await getToken();
            await jobService.deleteJob(jobId, token);
            toast.success('Job deleted successfully.');
            setJobs(jobs.filter((j) => j.id !== jobId));
        } catch (error) {
            toast.error('Failed to delete job.');
        }
    };

    const handleViewApplicants = async (jobId) => {
        if (expandedJobId === jobId) {
            setExpandedJobId(null);
            return;
        }

        setExpandedJobId(jobId);

        // Only fetch if not already loaded
        if (!applicants[jobId]) {
            setLoadingApplicants(jobId);
            try {
                const token = await getToken();
                const data = await applicationService.getJobApplications(jobId, token);
                setApplicants((prev) => ({ ...prev, [jobId]: data }));
            } catch (error) {
                console.error('Error fetching applicants:', error);
                toast.error('Failed to load applicants.');
            } finally {
                setLoadingApplicants(null);
            }
        }
    };

    const handleDownloadCVs = async (jobId, jobTitle) => {
        setDownloadingCVs(jobId);
        try {
            const token = await getToken();
            await applicationService.downloadCVs(jobId, jobTitle, token);
            toast.success('CVs downloaded successfully!');
        } catch (error) {
            const msg = error.response?.status === 404
                ? 'No CVs found for this job.'
                : 'Failed to download CVs.';
            toast.error(msg);
        } finally {
            setDownloadingCVs(null);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();

        if (!newPassword || newPassword.length < 6) {
            toast.error('Password must be at least 6 characters.');
            return;
        }
        if (newPassword !== confirmNewPassword) {
            toast.error('Passwords do not match.');
            return;
        }

        setChangingPassword(true);
        try {
            const token = await getToken();
            await companyService.changePassword(newPassword, token);
            toast.success('Password updated successfully!');
            setNewPassword('');
            setConfirmNewPassword('');
        } catch (error) {
            toast.error('Failed to change password.');
        } finally {
            setChangingPassword(false);
        }
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
        });
    };

    const isNewPost = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        return (now - date) < 2 * 24 * 60 * 60 * 1000;
    };

    if (!currentUser || userType !== 'company') return <Loader />;

    return (
        <div className="dashboard-page">
            <div className="dashboard-header">
                <div>
                    <h1>Company Dashboard</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        Welcome, {userProfile?.companyName}
                    </p>
                </div>
                <div className="dashboard-header-actions">
                    <button
                        className="navbar-btn navbar-btn-primary"
                        onClick={() => setActiveTab('post')}
                    >
                        <FiPlus size={16} /> Post New Job
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="dashboard-tabs">
                <button
                    className={`dashboard-tab ${activeTab === 'jobs' ? 'active' : ''}`}
                    onClick={() => setActiveTab('jobs')}
                >
                    <FiBriefcase size={16} /> My Jobs ({jobs.length})
                </button>
                <button
                    className={`dashboard-tab ${activeTab === 'post' ? 'active' : ''}`}
                    onClick={() => setActiveTab('post')}
                >
                    <FiPlus size={16} /> Post Job
                </button>
                <button
                    className={`dashboard-tab ${activeTab === 'settings' ? 'active' : ''}`}
                    onClick={() => setActiveTab('settings')}
                >
                    <FiSettings size={16} /> Settings
                </button>
            </div>

            {/* My Jobs Tab */}
            {activeTab === 'jobs' && (
                <div>
                    {loading ? (
                        <Loader />
                    ) : jobs.length > 0 ? (
                        jobs.map((job) => (
                            <div key={job.id} className={`dashboard-job-card ${job.isExpired ? 'expired' : ''}`}>
                                <div className="dashboard-job-top">
                                    <div>
                                        <h3 className="dashboard-job-title">
                                            {job.title}
                                            {job.isExpired ? (
                                                <span style={{
                                                    marginLeft: '8px',
                                                    fontSize: '0.7rem',
                                                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                                                    color: 'white',
                                                    padding: '0.15rem 0.5rem',
                                                    borderRadius: 'var(--radius-full)',
                                                    verticalAlign: 'middle',
                                                }}>
                                                    EXPIRED
                                                </span>
                                            ) : isNewPost(job.createdAt) ? (
                                                <span style={{
                                                    marginLeft: '8px',
                                                    fontSize: '0.7rem',
                                                    background: 'linear-gradient(135deg, var(--accent), var(--accent-light))',
                                                    color: 'white',
                                                    padding: '0.15rem 0.5rem',
                                                    borderRadius: 'var(--radius-full)',
                                                    verticalAlign: 'middle',
                                                }}>
                                                    NEW
                                                </span>
                                            ) : null}
                                        </h3>
                                        <div className="dashboard-job-meta">
                                            <span><FiMapPin size={14} /> {job.location}</span>
                                            <span><FiClock size={14} /> {job.jobType}</span>
                                            <span><FiUsers size={14} /> {job.applicantCount || 0} applicants</span>
                                            <span>Posted {formatDate(job.createdAt)}</span>
                                            {job.closingDate && (
                                                <span style={{ color: job.isExpired ? 'var(--error)' : 'var(--text-secondary)' }}>
                                                    <FiCalendar size={14} /> Closes {formatDate(job.closingDate)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="dashboard-job-actions">
                                        <button
                                            className="dashboard-action-btn"
                                            onClick={() => handleViewApplicants(job.id)}
                                            title="View applicants"
                                        >
                                            {expandedJobId === job.id ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
                                        </button>
                                        <button
                                            className="dashboard-action-btn"
                                            onClick={() => handleDownloadCVs(job.id, job.title)}
                                            disabled={downloadingCVs === job.id || (job.applicantCount || 0) === 0}
                                            title="Download all CVs as ZIP"
                                        >
                                            {downloadingCVs === job.id ? (
                                                <div className="btn-spinner" />
                                            ) : (
                                                <FiDownload size={16} />
                                            )}
                                        </button>
                                        <button
                                            className="dashboard-action-btn danger"
                                            onClick={() => handleDeleteJob(job.id)}
                                            title="Delete job"
                                        >
                                            <FiTrash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* Applicants Expandable Section */}
                                {expandedJobId === job.id && (
                                    <div className="applicants-section">
                                        {loadingApplicants === job.id ? (
                                            <Loader />
                                        ) : applicants[job.id]?.length > 0 ? (
                                            <>
                                                <div className="applicants-header">
                                                    <h4><FiUsers size={16} /> {applicants[job.id].length} Applicant{applicants[job.id].length !== 1 ? 's' : ''}</h4>
                                                    <button
                                                        className="applicants-download-btn"
                                                        onClick={() => handleDownloadCVs(job.id, job.title)}
                                                        disabled={downloadingCVs === job.id}
                                                    >
                                                        {downloadingCVs === job.id ? (
                                                            <Loader inline text="Downloading..." />
                                                        ) : (
                                                            <><FiDownload size={14} /> Download All CVs (ZIP)</>
                                                        )}
                                                    </button>
                                                </div>
                                                <div className="applicants-list">
                                                    {applicants[job.id].map((app) => (
                                                        <div key={app.id} className="applicant-card">
                                                            <div className="applicant-avatar">
                                                                {app.username?.charAt(0)?.toUpperCase() || 'A'}
                                                            </div>
                                                            <div className="applicant-info">
                                                                <h5>{app.username}</h5>
                                                                <div className="applicant-details">
                                                                    <span><FiMail size={13} /> {app.email}</span>
                                                                    <span><FiPhone size={13} /> {app.phone}</span>
                                                                    <span><FiCalendar size={13} /> Applied {formatDate(app.createdAt)}</span>
                                                                </div>
                                                                {app.coverLetter && (
                                                                    <p className="applicant-cover-letter">{app.coverLetter}</p>
                                                                )}
                                                            </div>
                                                            <div className="applicant-actions">
                                                                {app.cvUrl && (
                                                                    <a
                                                                        href={app.cvUrl}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="applicant-cv-btn"
                                                                        title="View CV"
                                                                    >
                                                                        <FiFileText size={14} /> View CV <FiExternalLink size={12} />
                                                                    </a>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        ) : (
                                            <div className="applicants-empty">
                                                <FiUsers size={24} />
                                                <p>No applications received yet.</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="dashboard-empty">
                            <div className="dashboard-empty-icon"><FiBriefcase /></div>
                            <h3>No jobs posted yet</h3>
                            <p>Create your first job post to start finding talent.</p>
                            <button
                                className="navbar-btn navbar-btn-primary"
                                style={{ marginTop: 'var(--space-md)' }}
                                onClick={() => setActiveTab('post')}
                            >
                                <FiPlus size={16} /> Post a Job
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Post Job Tab */}
            {activeTab === 'post' && (
                <div className="post-job-form">
                    <h2>Create Job Post</h2>
                    <form onSubmit={handlePostJob}>
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="post-title">Job Title *</label>
                                <input
                                    id="post-title"
                                    className="form-input"
                                    value={postForm.title}
                                    onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                                    placeholder="e.g. Senior React Developer"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="post-location">Location *</label>
                                <input
                                    id="post-location"
                                    className="form-input"
                                    value={postForm.location}
                                    onChange={(e) => setPostForm({ ...postForm, location: e.target.value })}
                                    placeholder="e.g. New York, NY or Remote"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="post-type">Job Type *</label>
                                <select
                                    id="post-type"
                                    className="form-input"
                                    value={postForm.jobType}
                                    onChange={(e) => setPostForm({ ...postForm, jobType: e.target.value })}
                                >
                                    <option value="Full-time">Full-time</option>
                                    <option value="Part-time">Part-time</option>
                                    <option value="Internship">Internship</option>
                                    <option value="Contract">Contract</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="post-salary">Salary Range</label>
                                <input
                                    id="post-salary"
                                    className="form-input"
                                    value={postForm.salary}
                                    onChange={(e) => setPostForm({ ...postForm, salary: e.target.value })}
                                    placeholder="e.g. $80K - $120K"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="post-desc">Job Description *</label>
                            <textarea
                                id="post-desc"
                                className="form-input form-textarea"
                                value={postForm.description}
                                onChange={(e) => setPostForm({ ...postForm, description: e.target.value })}
                                placeholder="Describe the role, responsibilities, requirements..."
                                rows={8}
                                required
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="post-keywords">Keywords (comma separated)</label>
                                <input
                                    id="post-keywords"
                                    className="form-input"
                                    value={postForm.keywords}
                                    onChange={(e) => setPostForm({ ...postForm, keywords: e.target.value })}
                                    placeholder="e.g. React, Node.js, TypeScript"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="post-cv-link">CV Collection Link</label>
                                <input
                                    id="post-cv-link"
                                    className="form-input"
                                    value={postForm.cvLink}
                                    onChange={(e) => setPostForm({ ...postForm, cvLink: e.target.value })}
                                    placeholder="https://..."
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="post-closing-date">Application Closing Date *</label>
                            <input
                                id="post-closing-date"
                                className="form-input"
                                type="date"
                                value={postForm.closingDate}
                                onChange={(e) => setPostForm({ ...postForm, closingDate: e.target.value })}
                                min={new Date().toISOString().split('T')[0]}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="form-btn form-btn-primary"
                            disabled={posting}
                            style={{ marginTop: 'var(--space-md)' }}
                        >
                            {posting ? <Loader inline text="Publishing..." /> : <><FiPlus size={18} /> Publish Job</>}
                        </button>
                    </form>
                </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
                <div className="change-password-card">
                    <h2>Change Password</h2>
                    <form onSubmit={handleChangePassword}>
                        <div className="form-group">
                            <label htmlFor="new-pass">New Password</label>
                            <input
                                id="new-pass"
                                className="form-input"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Min. 6 characters"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="confirm-new-pass">Confirm New Password</label>
                            <input
                                id="confirm-new-pass"
                                className="form-input"
                                type="password"
                                value={confirmNewPassword}
                                onChange={(e) => setConfirmNewPassword(e.target.value)}
                                placeholder="Repeat your password"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="form-btn form-btn-primary"
                            disabled={changingPassword}
                        >
                            {changingPassword ? <Loader inline text="Updating..." /> : 'Update Password'}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default CompanyDashboard;
