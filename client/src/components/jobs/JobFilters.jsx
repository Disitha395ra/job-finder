import { useState } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import './JobFilters.css';

const JobFilters = ({ onFilter, initialFilters = {} }) => {
    const [filters, setFilters] = useState({
        keyword: initialFilters.keyword || '',
        location: initialFilters.location || '',
        type: initialFilters.type || 'all',
        datePosted: initialFilters.datePosted || '',
    });

    const handleChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onFilter(filters);
    };

    const handleClear = () => {
        const cleared = { keyword: '', location: '', type: 'all', datePosted: '' };
        setFilters(cleared);
        onFilter(cleared);
    };

    return (
        <div className="job-filters">
            <div className="job-filters-title">Filter Jobs</div>
            <form className="job-filters-grid" onSubmit={handleSubmit}>
                <div className="filter-group">
                    <label htmlFor="filter-keyword">Keywords</label>
                    <input
                        id="filter-keyword"
                        type="text"
                        name="keyword"
                        placeholder="e.g. React, Design, Marketing"
                        value={filters.keyword}
                        onChange={handleChange}
                    />
                </div>

                <div className="filter-group">
                    <label htmlFor="filter-location">Location</label>
                    <input
                        id="filter-location"
                        type="text"
                        name="location"
                        placeholder="e.g. New York, Remote"
                        value={filters.location}
                        onChange={handleChange}
                    />
                </div>

                <div className="filter-group">
                    <label htmlFor="filter-type">Job Type</label>
                    <select
                        id="filter-type"
                        name="type"
                        value={filters.type}
                        onChange={handleChange}
                    >
                        <option value="all">All Types</option>
                        <option value="Full-time">Full-time</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Internship">Internship</option>
                        <option value="Contract">Contract</option>
                    </select>
                </div>

                <div className="filter-group">
                    <label htmlFor="filter-date">Date Posted</label>
                    <select
                        id="filter-date"
                        name="datePosted"
                        value={filters.datePosted}
                        onChange={handleChange}
                    >
                        <option value="">Any time</option>
                        <option value="24h">Last 24 hours</option>
                        <option value="7d">Last 7 days</option>
                        <option value="30d">Last 30 days</option>
                    </select>
                </div>

                <div className="filter-actions">
                    <button type="submit" className="filter-btn filter-btn-search">
                        <FiSearch size={16} />
                        Search
                    </button>
                    <button type="button" className="filter-btn filter-btn-clear" onClick={handleClear}>
                        <FiX size={16} />
                        Clear
                    </button>
                </div>
            </form>
        </div>
    );
};

export default JobFilters;
