import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FiSearch } from 'react-icons/fi';
import JobCard from '../components/jobs/JobCard';
import JobFilters from '../components/jobs/JobFilters';
import Loader from '../components/ui/Loader';
import { jobService } from '../services/jobService';
import './HomePage.css';

const HomePage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalJobs, setTotalJobs] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [heroSearch, setHeroSearch] = useState('');
    const [filters, setFilters] = useState({
        keyword: searchParams.get('keyword') || '',
        location: '',
        type: 'all',
        datePosted: '',
    });

    useEffect(() => {
        const keyword = searchParams.get('keyword');
        if (keyword) {
            setFilters((prev) => ({ ...prev, keyword }));
        }
    }, [searchParams]);

    useEffect(() => {
        fetchJobs();
    }, [filters, currentPage]);

    const fetchJobs = async () => {
        setLoading(true);
        try {
            const data = await jobService.getJobs({ ...filters, page: currentPage, limit: 15 });
            setJobs(data.jobs);
            setTotalJobs(data.total);
            setTotalPages(data.totalPages);
        } catch (error) {
            console.error('Error fetching jobs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilter = (newFilters) => {
        setFilters(newFilters);
        setCurrentPage(1);
    };

    const handleHeroSearch = (e) => {
        e.preventDefault();
        if (heroSearch.trim()) {
            setFilters({ ...filters, keyword: heroSearch.trim() });
            setCurrentPage(1);
        }
    };

    return (
        <div className="homepage">
            {/* Hero Section */}
            <section className="home-hero">
                <div className="home-hero-content animate-fade-in-up">
                    <h1>
                        Find Your <span>Dream Job</span> Today
                    </h1>
                    <p>
                        Discover thousands of job opportunities from top companies. Your next career move starts here.
                    </p>

                    <form className="hero-search" onSubmit={handleHeroSearch}>
                        <input
                            type="text"
                            placeholder="Job title, keyword, or company..."
                            value={heroSearch}
                            onChange={(e) => setHeroSearch(e.target.value)}
                        />
                        <button type="submit" className="hero-search-btn">
                            <FiSearch size={18} />
                            Search Jobs
                        </button>
                    </form>

                    <div className="home-stats">
                        <div className="home-stat">
                            <span className="home-stat-number">{totalJobs}+</span>
                            <span className="home-stat-label">Active Jobs</span>
                        </div>
                        <div className="home-stat">
                            <span className="home-stat-number">500+</span>
                            <span className="home-stat-label">Companies</span>
                        </div>
                        <div className="home-stat">
                            <span className="home-stat-number">10K+</span>
                            <span className="home-stat-label">Job Seekers</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <div className="home-content">
                <JobFilters onFilter={handleFilter} initialFilters={filters} />

                <div className="home-section-header">
                    <h2>Latest Job Openings</h2>
                    <span>{totalJobs} jobs found</span>
                </div>

                {loading ? (
                    <Loader />
                ) : jobs.length > 0 ? (
                    <>
                        <div className="jobs-grid">
                            {jobs.map((job) => (
                                <JobCard key={job.id} job={job} />
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="pagination">
                                <button
                                    className="pagination-btn"
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                >
                                    ‹
                                </button>
                                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                    const page = i + 1;
                                    return (
                                        <button
                                            key={page}
                                            className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                                            onClick={() => setCurrentPage(page)}
                                        >
                                            {page}
                                        </button>
                                    );
                                })}
                                <button
                                    className="pagination-btn"
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    ›
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="jobs-empty">
                        <h3>No jobs found</h3>
                        <p>Try adjusting your search filters or check back later for new openings.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HomePage;
