const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

interface FetchOptions extends RequestInit {
    token?: string;
}

class ApiClient {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    private async request<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
        const { token, ...init } = options;

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(init.headers as Record<string, string>),
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(`${this.baseUrl}${endpoint}`, {
            ...init,
            headers,
            credentials: 'include', // Send HttpOnly cookies
        });

        if (!res.ok) {
            const error = await res.json().catch(() => ({ message: 'Request failed' }));
            throw new Error(error.message || `HTTP ${res.status}`);
        }

        if (res.status === 204) return {} as T;
        return res.json();
    }

    // Auth
    async register(data: { email: string; password: string; fullName: string; role: string }) {
        return this.request<{ accessToken: string; user: any }>('/auth/register', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async login(data: { email: string; password: string }) {
        return this.request<{ accessToken: string; user: any }>('/auth/login', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async refresh() {
        return this.request<{ accessToken: string; user: any }>('/auth/refresh', {
            method: 'POST',
        });
    }

    async updateLocale(locale: string) {
        return this.request<void>('/users/me/locale', {
            method: 'PATCH',
            body: JSON.stringify({ locale }),
        });
    }

    async logout(token: string) {
        return this.request<void>('/auth/logout', { method: 'POST', token });
    }

    // Profile
    async getProfile(token: string) {
        return this.request<any>('/students/profile', { token });
    }

    async updateProfile(token: string, data: any) {
        return this.request<any>('/students/profile', {
            method: 'PUT',
            body: JSON.stringify(data),
            token,
        });
    }

    async updateSkills(token: string, data: { skills: { skillId: number; proficiency: number }[] }) {
        return this.request<void>('/students/skills', {
            method: 'PUT',
            body: JSON.stringify(data),
            token,
        });
    }

    async searchSkills(query: string) {
        return this.request<any[]>(`/skills?q=${encodeURIComponent(query)}`);
    }

    // Internships
    async searchInternships(params: {
        page?: number;
        size?: number;
        q?: string;
        category?: string;
        state?: string;
        workMode?: string;
    } = {}) {
        const query = new URLSearchParams();

        if (params.page !== undefined) query.set('page', params.page.toString());
        if (params.size !== undefined) query.set('size', params.size.toString());
        if (params.q) query.set('q', params.q);
        if (params.category) query.set('category', params.category);
        if (params.state) query.set('state', params.state);
        if (params.workMode) query.set('workMode', params.workMode);

        return this.request<any>(`/internships?${query.toString()}`);
    }

    async getInternship(id: string) {
        return this.request<any>(`/internships/${id}`);
    }

    // Applications
    async apply(internshipId: string, coverNote?: string) {
        return this.request<any>(`/internships/${internshipId}/apply`, {
            method: 'POST',
            body: JSON.stringify({ coverNote }),
        });
    }

    async withdraw(internshipId: string) {
        return this.request<void>(`/internships/${internshipId}/apply`, {
            method: 'DELETE',
        });
    }

    async getMyApplications(page = 0, size = 20) {
        const res = await this.request<any>(`/applications/my?page=${page}&size=${size}`);
        return res;
    }

    async getInternshipApplications(internshipId: string, page = 0, size = 20) {
        return this.request<any>(`/internships/${internshipId}/applications?page=${page}&size=${size}`);
    }

    async updateApplicationStatus(applicationId: string, status: string) {
        return this.request<any>(`/applications/${applicationId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        });
    }

    // Provider Internship Management
    async createInternship(data: any) {
        return this.request<any>('/internships', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async getMyInternships(page = 0, size = 20) {
        return this.request<any>(`/internships/my?page=${page}&size=${size}`);
    }

    async getRecommendations(token: string, limit = 10) {
        return this.request<any>(`/recommendations?limit=${limit}`, { token });
    }

    // Provider Specific (P1.9)
    async getProviderInternships() {
        return this.request<any>('/internships/my?size=100'); // Fetch all for now or implement pagination in UI
    }

    async getApplicants(internshipId: string) {
        return this.request<any>(`/internships/${internshipId}/applications?size=100`);
    }

    // Admin
    async getAdminStats() {
        return this.request<any>('/admin/stats');
    }

    async getUsers(page = 0, size = 10) {
        return this.request<any>(`/admin/users?page=${page}&size=${size}`);
    }

    async banUser(userId: string) {
        return this.request<void>(`/admin/users/${userId}/ban`, { method: 'PATCH' });
    }

    async unbanUser(userId: string) {
        return this.request<void>(`/admin/users/${userId}/unban`, { method: 'PATCH' });
    }

    async getAuditLogs(page = 0, size = 10) {
        return this.request<any>(`/admin/audit-logs?page=${page}&size=${size}`);
    }
}

export const api = new ApiClient(API_URL);
