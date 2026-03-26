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
        const text = await res.text();
        return text ? JSON.parse(text) : ({} as T);
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

    async googleLogin(data: { idToken: string; role?: string }) {
        return this.request<{ accessToken: string; user: any }>('/auth/google', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async refresh() {
        return this.request<{ accessToken: string; user: any }>('/auth/refresh', {
            method: 'POST',
        });
    }

    async updateLocale(token: string, locale: string) {
        return this.request<void>('/users/me/locale', {
            method: 'PATCH',
            body: JSON.stringify({ locale }),
            token,
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

    // Documents
    async uploadDocument(token: string, file: File, type: string) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);

        const res = await fetch(`${this.baseUrl}/students/documents`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
        });

        if (!res.ok) {
            const error = await res.json().catch(() => ({ message: 'Upload failed' }));
            throw new Error(error.message || `HTTP ${res.status}`);
        }
        return res.json();
    }

    async getDocuments(token: string) {
        return this.request<any[]>('/students/documents', { token });
    }

    async deleteDocument(token: string, id: string) {
        return this.request<void>(`/students/documents/${id}`, { method: 'DELETE', token });
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
    async apply(token: string, internshipId: string, coverNote?: string) {
        return this.request<any>(`/internships/${internshipId}/apply`, {
            method: 'POST',
            body: JSON.stringify({ coverNote }),
            token,
        });
    }

    async withdraw(token: string, internshipId: string) {
        return this.request<void>(`/internships/${internshipId}/apply`, {
            method: 'DELETE',
            token,
        });
    }

    async getMyApplications(token: string, page = 0, size = 20) {
        const res = await this.request<any>(`/applications/my?page=${page}&size=${size}`, { token });
        return res;
    }

    async getInternshipApplications(token: string, internshipId: string, page = 0, size = 20) {
        return this.request<any>(`/internships/${internshipId}/applications?page=${page}&size=${size}`, { token });
    }

    async updateApplicationStatus(token: string, applicationId: string, status: string) {
        return this.request<any>(`/applications/${applicationId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
            token,
        });
    }

    // Provider Internship Management
    async createInternship(token: string, data: any) {
        return this.request<any>('/internships', {
            method: 'POST',
            body: JSON.stringify(data),
            token,
        });
    }

    async getMyInternships(token: string, page = 0, size = 20) {
        return this.request<any>(`/internships/my?page=${page}&size=${size}`, { token });
    }

    async getRecommendations(token: string, limit = 10) {
        return this.request<any>(`/recommendations?limit=${limit}`, { token });
    }

    // Provider Specific (P1.9)
    async getProviderInternships(token: string) {
        return this.request<any>('/internships/my?size=100', { token });
    }

    async getApplicants(token: string, internshipId: string) {
        return this.request<any>(`/internships/${internshipId}/applications?size=100`, { token });
    }

    // Admin
    async getAdminStats(token: string) {
        return this.request<any>('/admin/stats', { token });
    }

    async getAdminFairnessStats(token: string) {
        return this.request<any>('/admin/fairness/stats', { token });
    }

    async getUsers(token: string, page = 0, size = 10) {
        return this.request<any>(`/admin/users?page=${page}&size=${size}`, { token });
    }

    async banUser(token: string, userId: string) {
        return this.request<void>(`/admin/users/${userId}/ban`, { method: 'PATCH', token });
    }

    async unbanUser(token: string, userId: string) {
        return this.request<void>(`/admin/users/${userId}/unban`, { method: 'PATCH', token });
    }

    async getAuditLogs(token: string, page = 0, size = 10) {
        return this.request<any>(`/admin/audit-logs?page=${page}&size=${size}`, { token });
    }

    // ── Admin Internship Management ─────────────────────────
    async getAdminInternships(token: string, page = 0, size = 10, status?: string) {
        const statusParam = status ? `&status=${status}` : '';
        return this.request<any>(`/admin/internships?page=${page}&size=${size}${statusParam}`, { token });
    }

    async adminUpdateInternshipStatus(token: string, internshipId: string, status: string) {
        return this.request<any>(`/admin/internships/${internshipId}/status`, {
            method: 'PATCH',
            token,
            body: JSON.stringify({ status }),
        });
    }

    async adminDeleteInternship(token: string, internshipId: string) {
        return this.request<void>(`/admin/internships/${internshipId}`, { method: 'DELETE', token });
    }
}

export const api = new ApiClient(API_URL);
