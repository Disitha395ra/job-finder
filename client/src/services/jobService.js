import api from './api';

export const jobService = {
    // Fetch jobs with optional filters
    getJobs: async (filters = {}) => {
        const params = new URLSearchParams();
        if (filters.keyword) params.append('keyword', filters.keyword);
        if (filters.location) params.append('location', filters.location);
        if (filters.type && filters.type !== 'all') params.append('type', filters.type);
        if (filters.datePosted) params.append('datePosted', filters.datePosted);
        if (filters.page) params.append('page', filters.page);
        if (filters.limit) params.append('limit', filters.limit);

        const res = await api.get(`/jobs?${params.toString()}`);
        return res.data;
    },

    // Get single job details
    getJob: async (id) => {
        const res = await api.get(`/jobs/${id}`);
        return res.data;
    },

    // Create job post (company only)
    createJob: async (jobData, token) => {
        const res = await api.post('/jobs', jobData, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data;
    },

    // Update job post
    updateJob: async (id, jobData, token) => {
        const res = await api.put(`/jobs/${id}`, jobData, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data;
    },

    // Delete job post
    deleteJob: async (id, token) => {
        const res = await api.delete(`/jobs/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data;
    },
};

export const applicationService = {
    // Submit job application with CV
    apply: async (formData, token) => {
        const res = await api.post('/applications', formData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data',
            },
        });
        return res.data;
    },

    // Get user's applications
    getUserApplications: async (token) => {
        const res = await api.get('/applications/user', {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data;
    },

    // Get applications for a job (company)
    getJobApplications: async (jobId, token) => {
        const res = await api.get(`/applications/job/${jobId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data;
    },

    // Download all CVs for a job as ZIP (company)
    downloadCVs: async (jobId, jobTitle, token) => {
        const res = await api.get(`/applications/job/${jobId}/download-cvs`, {
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'blob',
        });
        // Trigger download
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        const safeTitle = jobTitle.replace(/[^a-zA-Z0-9_-]/g, '_');
        link.setAttribute('download', `${safeTitle}_CVs.zip`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    },
};

export const companyService = {
    // Get company jobs
    getCompanyJobs: async (token) => {
        const res = await api.get('/companies/jobs', {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data;
    },

    // Change password
    changePassword: async (newPassword, token) => {
        const res = await api.put(
            '/companies/password',
            { newPassword },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    },
};
