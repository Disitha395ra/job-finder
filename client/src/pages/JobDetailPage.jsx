import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiMapPin, FiClock, FiDollarSign, FiCalendar, FiUsers, FiUpload, FiSend } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { jobService, applicationService } from '../services/jobService';
import Loader from '../components/ui/Loader';
import '../components/auth/AuthForms.css';
import './JobDetailPage.css';

const JobDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentUser, userType, getToken } = useAuth();
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showApplyForm, setShowApplyForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [applied, setApplied] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        phone: '',
        coverLetter: '',
    });
    const [cvFile, setCvFile] = useState(null);

    useEffect(() => {
        fetchJob();
    }, [id]);

    const fetchJob = async () => {
        setLoading(true);
        try {
            const data = await jobService.getJob(id);
            setJob(data);
        } catch (error) {
            toast.error('Failed to load job details.');
            navigate('/');
        } finally {
            setLoading(false);
        }
    };

    const handleApplyClick = () => {
        if (!currentUser) return;
        if (userType === 'company') {
            toast.warning('Companies cannot apply for jobs. Please use a job seeker account.');
            return;
        }
        setShowApplyForm(true);
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                toast.error('File size must be less than 10MB.');
                return;
            }
            setCvFile(file);
        }
    };

    const handleSubmitApplication = async (e) => {
        e.preventDefault();

        if (!formData.username.trim() || !formData.email.trim() || !formData.phone.trim()) {
            toast.error('Please fill in all required fields.');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            toast.error('Please enter a valid email address.');
            return;
        }

        setSubmitting(true);
        try {
            const token = await getToken();
            const data = new FormData();
            data.append('jobId', id);
            data.append('username', formData.username);
            data.append('email', formData.email);
            data.append('phone', formData.phone);
            data.append('coverLetter', formData.coverLetter);
            if (cvFile) {
                data.append('cv', cvFile);
            }

            await applicationService.apply(data, token);
            toast.success('Your application has been successfully submitted.');
            setApplied(true);
            setShowApplyForm(false);
        } catch (error) {
            const msg = error.response?.data?.error || 'Failed to submit application.';
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    if (loading) return <Loader />;
    if (!job) return null;

    return (
        <div className="job-detail-page">
            <button className="job-detail-back" onClick={() => navigate(-1)}>
                <FiArrowLeft size={18} />
                Back to Jobs
            </button>

            <div className="job-detail-card">
                {/* Header */}
                <div className="job-detail-header">
                    <div className="job-detail-header-inner">
                        <div className="job-detail-logo">
                            {job.companyName?.charAt(0)?.toUpperCase()}
                        </div>
                        <div className="job-detail-title-section">
                            <h1>{job.title}</h1>
                            <span className="job-detail-company-name">{job.companyName}</span>
                            <div className="job-detail-meta">
                                <span className="job-detail-meta-item">
                                    <FiMapPin size={16} /> {job.location}
                                </span>
                                <span className="job-detail-meta-item">
                                    <FiClock size={16} /> {job.jobType}
                                </span>
                                {job.salary && (
                                    <span className="job-detail-meta-item">
                                        <FiDollarSign size={16} /> {job.salary}
                                    </span>
                                )}
                                <span className="job-detail-meta-item">
                                    <FiCalendar size={16} /> {formatDate(job.createdAt)}
                                </span>
                                <span className="job-detail-meta-item">
                                    <FiUsers size={16} /> {job.applicantCount || 0} applicants
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="job-detail-body">
                    <div className="job-detail-section">
                        <h2>Job Description</h2>
                        <p className="job-detail-description">{job.description}</p>
                    </div>

                    {job.keywords?.length > 0 && (
                        <div className="job-detail-section">
                            <h2>Skills & Keywords</h2>
                            <div className="job-detail-keywords">
                                {job.keywords.map((kw, i) => (
                                    <span key={i} className="job-detail-keyword">{kw}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Apply Section */}
                <div className="job-detail-apply">
                    {applied ? (
                        <div className="alert alert-success">
                            ✅ Your application has been successfully submitted. You can track it in your Applied Jobs.
                        </div>
                    ) : !currentUser ? (
                        <div className="apply-login-prompt">
                            <p>You need to sign in to apply for this job.</p>
                            <div className="apply-login-actions">
                                <button
                                    className="apply-login-btn apply-login-btn-primary"
                                    onClick={() => navigate('/login', { state: { from: `/jobs/${id}` } })}
                                >
                                    Sign In
                                </button>
                                <button
                                    className="apply-login-btn apply-login-btn-outline"
                                    onClick={() => navigate('/register', { state: { from: `/jobs/${id}` } })}
                                >
                                    Create Account
                                </button>
                            </div>
                        </div>
                    ) : !showApplyForm ? (
                        <button className="apply-btn" onClick={handleApplyClick}>
                            <FiSend size={18} />
                            Apply Now
                        </button>
                    ) : (
                        <form className="application-form" onSubmit={handleSubmitApplication}>
                            <h3>Submit Your Application</h3>

                            <div className="form-group">
                                <label htmlFor="app-username">Full Name *</label>
                                <input
                                    id="app-username"
                                    className="form-input"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    placeholder="John Doe"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="app-email">Email *</label>
                                <input
                                    id="app-email"
                                    className="form-input"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="john@example.com"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="app-phone">Phone Number *</label>
                                <input
                                    id="app-phone"
                                    className="form-input"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    placeholder="+1 234 567 8900"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="app-cover">Cover Letter</label>
                                <textarea
                                    id="app-cover"
                                    className="form-input form-textarea"
                                    name="coverLetter"
                                    value={formData.coverLetter}
                                    onChange={handleInputChange}
                                    placeholder="Tell us why you're a great fit for this role..."
                                    rows={5}
                                />
                            </div>

                            <div className="form-group">
                                <label>CV / Resume (PDF or Word, max 10MB)</label>
                                <div className={`file-upload ${cvFile ? 'has-file' : ''}`}>
                                    <input
                                        type="file"
                                        accept=".pdf,.doc,.docx"
                                        onChange={handleFileChange}
                                    />
                                    <div className="file-upload-icon">
                                        <FiUpload />
                                    </div>
                                    <p className="file-upload-text">
                                        {cvFile ? '' : <>Drag & drop or <strong>browse</strong> to upload</>}
                                    </p>
                                    {cvFile && <p className="file-upload-name">✅ {cvFile.name}</p>}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' }}>
                                <button
                                    type="submit"
                                    className="form-btn form-btn-primary"
                                    disabled={submitting}
                                    style={{ flex: 1 }}
                                >
                                    {submitting ? <Loader inline text="Submitting..." /> : <><FiSend size={16} /> Submit Application</>}
                                </button>
                                <button
                                    type="button"
                                    className="form-btn form-btn-secondary"
                                    onClick={() => setShowApplyForm(false)}
                                    disabled={submitting}
                                    style={{ flex: 0.5 }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default JobDetailPage;
