import axios from 'axios';

const AUTH_TOKEN_KEY = 'pinoygig.auth.token';

export const getStoredToken = () => {
    if (typeof window === 'undefined') {
        return null;
    }

    return window.localStorage.getItem(AUTH_TOKEN_KEY);
};

export const setStoredToken = (token) => {
    if (typeof window === 'undefined') {
        return;
    }

    if (token) {
        window.localStorage.setItem(AUTH_TOKEN_KEY, token);
        return;
    }

    window.localStorage.removeItem(AUTH_TOKEN_KEY);
};

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = getStoredToken();

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    } else if (config.headers?.Authorization) {
        delete config.headers.Authorization;
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            console.warn('Unauthorized access - Redirecting to login...');
            setStoredToken(null);
        }
        return Promise.reject(error);
    }
);

export const bidsAPI = {
    create: (data) => api.post('/bids', data),
    getByGigId: (gigId) => api.get(`/bids/gig/${gigId}`),
    getMyBids: () => api.get('/bids/my-bids'),
    hire: (bidId) => api.patch(`/bids/${bidId}/hire`),
};

export const gigsAPI = {
    getAll: (search = '') => api.get('/gigs', { params: search ? { search } : {} }),
    getById: (id) => api.get(`/gigs/${id}`),
    getByOwner: (userId) => api.get(`/gigs/owner/${userId}`),
    create: (data) => api.post('/gigs', data),
    getMyGigs: () => api.get('/gigs/my-gigs'),
    delete: (id) => api.delete(`/gigs/${id}`),
    update: (id, data) => api.put(`/gigs/${id}`, data),
    complete: (id) => api.patch(`/gigs/${id}/complete`),
    requestComplete: (id) => api.patch(`/gigs/${id}/request-complete`),
};


export const reviewsAPI = {
    create: (data) => api.post('/reviews', data),
    getByUserId: (userId) => api.get(`/reviews/user/${userId}`),
};

export const chatsAPI = {
    getSummary: () => api.get('/chats/summary'),
    getConversations: () => api.get('/chats/conversations'),
    getGigAccess: (gigId) => api.get(`/chats/gig/${gigId}/access`),
    getGigMessages: (gigId) => api.get(`/chats/gig/${gigId}`),
    markGigRead: (gigId) => api.patch(`/chats/gig/${gigId}/read`),
    sendGigMessage: (gigId, data) => api.post(`/chats/gig/${gigId}`, data),
    deleteGigMessage: (gigId, messageId) => api.delete(`/chats/gig/${gigId}/${messageId}`),
};

export const usersAPI = {
    getPublicProfile: (id) => api.get(`/auth/public/${id}`),
    updateProfile: (data) => api.patch('/auth/update-profile', data),
};

export const walletAPI = {
    getSummary: () => api.get('/auth/wallet'),
};

export const adminAPI = {
    getDashboard: () => api.get('/admin/dashboard'),
    getUsers: () => api.get('/admin/users'),
    getGigs: () => api.get('/admin/gigs'),
    deleteUser: (id) => api.delete(`/admin/users/${id}`),
    deleteGig: (id) => api.delete(`/admin/gigs/${id}`),
};

export default api;