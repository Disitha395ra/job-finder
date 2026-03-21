import { useNavigate } from 'react-router-dom';
import { FiMapPin, FiClock, FiDollarSign, FiSearch, FiCalendar } from 'react-icons/fi';
import './JobCard.css';

const JobCard = ({ job }) => {
    const navigate = useNavigate();

    const getTypeClass = (type) => {
        switch (type?.toLowerCase()) {
            case 'full-time': return 'fulltime';
            case 'part-time': return 'parttime';
            case 'internship': return 'internship';
            case 'contract': return 'contract';
            default: return 'fulltime';
        }
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now - date;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffHours < 1) return 'Just now';
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const isNew = () => {
        const date = new Date(job.createdAt);
        const now = new Date();
        return (now - date) < 2 * 24 * 60 * 60 * 1000; // 2 days
    };

    return (
        <div
            className="job-card"
            onClick={() => navigate(`/jobs/${job.id}`)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate(`/jobs/${job.id}`)}
        >
            {isNew() && <span className="job-card-badge-new">New</span>}

            <div className="job-card-header">
                <div className="job-card-company-logo">
                    {job.companyName?.charAt(0)?.toUpperCase() || 'C'}
                </div>
                <div className="job-card-info">
                    <h3 className="job-card-title">{job.title}</h3>
                    <span className="job-card-company">{job.companyName}</span>
                </div>
                <div className="job-card-search-icon">
                    <FiSearch size={16} />
                </div>
            </div>

            <div className="job-card-meta">
                <span className="job-card-meta-item">
                    <FiMapPin size={14} />
                    {job.location}
                </span>
                <span className="job-card-meta-item">
                    <FiClock size={14} />
                    {job.jobType}
                </span>
                {job.salary && (
                    <span className="job-card-meta-item">
                        <FiDollarSign size={14} />
                        {job.salary}
                    </span>
                )}
                {job.closingDate && (
                    <span className="job-card-meta-item">
                        <FiCalendar size={14} />
                        Closes {new Date(job.closingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                )}
            </div>

            <p className="job-card-description">{job.description}</p>

            <div className="job-card-tags">
                <span className={`job-card-tag ${getTypeClass(job.jobType)}`}>
                    {job.jobType}
                </span>
                {job.keywords?.slice(0, 3).map((keyword, index) => (
                    <span key={index} className="job-card-tag" style={{ background: 'var(--gray-100)', color: 'var(--text-secondary)' }}>
                        {keyword}
                    </span>
                ))}
            </div>

            <div className="job-card-date">{formatDate(job.createdAt)}</div>
        </div>
    );
};

export default JobCard;
