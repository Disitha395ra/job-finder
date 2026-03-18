import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiSearch, FiBriefcase, FiUser, FiLogOut, FiFileText, FiMenu, FiX } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
    const { currentUser, userProfile, userType, logout } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/?keyword=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    const handleLogout = async () => {
        await logout();
        setShowDropdown(false);
        navigate('/');
    };

    const getInitials = () => {
        const name = userProfile?.fullName || userProfile?.companyName || '';
        return name.charAt(0).toUpperCase() || 'U';
    };

    return (
        <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
            <div className="navbar-inner">
                {/* Logo */}
                <Link to="/" className="navbar-logo">
                    <div className="logo-icon">
                        <FiBriefcase />
                    </div>
                    JobFinder
                </Link>

                {/* Search Bar */}
                <form className="navbar-search" onSubmit={handleSearch}>
                    <input
                        type="text"
                        placeholder="Search jobs, companies, keywords..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button type="submit" className="navbar-search-btn" aria-label="Search">
                        <FiSearch size={16} />
                    </button>
                </form>

                {/* Right Section */}
                <div className="navbar-right">
                    {/* Company / Post Job Button */}
                    <button
                        className="navbar-btn navbar-btn-company"
                        onClick={() => navigate(userType === 'company' ? '/company/dashboard' : '/company/login')}
                    >
                        <FiBriefcase size={16} />
                        <span>{userType === 'company' ? 'Dashboard' : 'Company / Post Job'}</span>
                    </button>

                    {currentUser ? (
                        <div className="navbar-profile" ref={dropdownRef}>
                            <div
                                className="navbar-avatar"
                                onClick={() => setShowDropdown(!showDropdown)}
                                role="button"
                                tabIndex={0}
                            >
                                {getInitials()}
                            </div>

                            {showDropdown && (
                                <div className="navbar-dropdown">
                                    <div className="dropdown-header">
                                        <strong>{userProfile?.fullName || userProfile?.companyName}</strong>
                                        <span>{currentUser.email}</span>
                                    </div>

                                    {userType === 'seeker' && (
                                        <button
                                            className="dropdown-item"
                                            onClick={() => { navigate('/profile/applied-jobs'); setShowDropdown(false); }}
                                        >
                                            <FiFileText size={16} />
                                            Applied Jobs
                                        </button>
                                    )}

                                    {userType === 'company' && (
                                        <button
                                            className="dropdown-item"
                                            onClick={() => { navigate('/company/dashboard'); setShowDropdown(false); }}
                                        >
                                            <FiBriefcase size={16} />
                                            Company Dashboard
                                        </button>
                                    )}

                                    <button
                                        className="dropdown-item"
                                        onClick={() => { navigate('/profile'); setShowDropdown(false); }}
                                    >
                                        <FiUser size={16} />
                                        Profile
                                    </button>

                                    <button className="dropdown-item danger" onClick={handleLogout}>
                                        <FiLogOut size={16} />
                                        Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <button className="navbar-btn navbar-btn-primary" onClick={() => navigate('/login')}>
                            <FiUser size={16} />
                            <span>Sign In</span>
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
