import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiCalendar, FiBriefcase } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/ui/Loader';
import './ProfilePage.css';

const ProfilePage = () => {
    const { currentUser, userProfile, userType, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && !currentUser) {
            navigate('/login');
        }
    }, [currentUser, loading]);

    if (loading) return <Loader />;
    if (!currentUser || !userProfile) return <Loader />;

    const getInitials = () => {
        const name = userProfile.fullName || userProfile.companyName || '';
        return name.charAt(0).toUpperCase();
    };

    return (
        <div className="profile-page">
            <div className="profile-card">
                <div className="profile-header">
                    <div className="profile-avatar">{getInitials()}</div>
                    <div className="profile-info">
                        <h1>{userProfile.fullName || userProfile.companyName}</h1>
                        <p>{currentUser.email}</p>
                        <div className="profile-badge">
                            {userType === 'seeker' ? (
                                <><FiUser size={14} /> Job Seeker</>
                            ) : (
                                <><FiBriefcase size={14} /> Company</>
                            )}
                        </div>
                    </div>
                </div>

                <div className="profile-body">
                    <div className="profile-section">
                        <h2><FiUser size={18} /> Account Details</h2>
                        <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                <FiMail size={16} style={{ color: 'var(--text-muted)' }} />
                                <div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Email</div>
                                    <div style={{ fontWeight: 600 }}>{currentUser.email}</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                <FiCalendar size={16} style={{ color: 'var(--text-muted)' }} />
                                <div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Member Since</div>
                                    <div style={{ fontWeight: 600 }}>
                                        {new Date(currentUser.metadata?.creationTime).toLocaleDateString('en-US', {
                                            year: 'numeric', month: 'long', day: 'numeric',
                                        })}
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                <FiUser size={16} style={{ color: 'var(--text-muted)' }} />
                                <div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Email Verified</div>
                                    <div style={{ fontWeight: 600, color: currentUser.emailVerified ? 'var(--success)' : 'var(--warning)' }}>
                                        {currentUser.emailVerified ? '✓ Verified' : '✗ Not verified'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {userType === 'seeker' && (
                        <div className="profile-section">
                            <h2><FiBriefcase size={18} /> Quick Links</h2>
                            <button
                                className="form-btn form-btn-primary"
                                style={{ maxWidth: '250px' }}
                                onClick={() => navigate('/profile/applied-jobs')}
                            >
                                <FiBriefcase size={16} /> View Applied Jobs
                            </button>
                        </div>
                    )}

                    {userType === 'company' && (
                        <div className="profile-section">
                            <h2><FiBriefcase size={18} /> Quick Links</h2>
                            <button
                                className="form-btn form-btn-primary"
                                style={{ maxWidth: '250px' }}
                                onClick={() => navigate('/company/dashboard')}
                            >
                                <FiBriefcase size={16} /> Go to Dashboard
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
