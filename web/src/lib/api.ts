const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

interface FetchOptions extends RequestInit {
  token?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: FetchOptions = {},
  ): Promise<T> {
    const { token, ...init } = options;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(init.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}${endpoint}`, {
        ...init,
        headers,
        credentials: "include", // Send HttpOnly cookies
      });
    } catch {
      throw new Error(
        "Unable to connect to the server. Please check your internet connection or try again later.",
      );
    }

    if (!res.ok) {
      const error = await res
        .json()
        .catch(() => ({ message: "Request failed" }));
      throw new Error(error.message || `HTTP ${res.status}`);
    }

    if (res.status === 204) return {} as T;
    const text = await res.text();
    return text ? JSON.parse(text) : ({} as T);
  }

  // Auth
  async register(data: {
    email: string;
    password: string;
    fullName: string;
    role: string;
  }) {
    return this.request<{ accessToken: string; user: any }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async login(data: { email: string; password: string }) {
    if (data.email === "student@demo.com" && data.password === "Demo@1234") {
      if (typeof window !== "undefined") localStorage.setItem("demo_mode", "student");
      return { accessToken: "mock-student-token", user: { id: "s1", email: data.email, fullName: "Demo Student", roles: ["ROLE_STUDENT"] } };
    }
    if (data.email === "provider@techcorp.com" && data.password === "Demo@1234") {
      if (typeof window !== "undefined") localStorage.setItem("demo_mode", "provider");
      return { accessToken: "mock-provider-token", user: { id: "p1", email: data.email, fullName: "Demo Provider", roles: ["ROLE_PROVIDER"] } };
    }
    return this.request<{ accessToken: string; user: any }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async googleLogin(data: { idToken: string; role?: string }) {
    return this.request<{ accessToken: string; user: any }>("/auth/google", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async refresh() {
    if (typeof window !== "undefined") {
      const mode = localStorage.getItem("demo_mode");
      if (mode === "student") return { accessToken: "mock-student-token", user: { id: "s1", email: "student@demo.com", fullName: "Demo Student", roles: ["ROLE_STUDENT"] } };
      if (mode === "provider") return { accessToken: "mock-provider-token", user: { id: "p1", email: "provider@techcorp.com", fullName: "Demo Provider", roles: ["ROLE_PROVIDER"] } };
    }
    return this.request<{ accessToken: string; user: any }>("/auth/refresh", {
      method: "POST",
    });
  }

  async updateLocale(token: string, locale: string) {
    return this.request<void>("/users/me/locale", {
      method: "PATCH",
      body: JSON.stringify({ locale }),
      token,
    });
  }

  async logout(token: string) {
    if (typeof window !== "undefined" && localStorage.getItem("demo_mode")) {
      localStorage.removeItem("demo_mode");
      return;
    }
    return this.request<void>("/auth/logout", { method: "POST", token });
  }

  // Profile
  async getProfile(token: string) {
    if (token === "mock-student-token") {
      return { id: "s1", fullName: "Demo Student", email: "student@demo.com", skills: [], headline: "Aspiring Engineer", location: "Bangalore", resumeUrl: "" };
    }
    return this.request<any>("/students/profile", { token });
  }

  async updateProfile(token: string, data: any) {
    return this.request<any>("/students/profile", {
      method: "PUT",
      body: JSON.stringify(data),
      token,
    });
  }

  async updateSkills(
    token: string,
    data: { skills: { skillId: number; proficiency: number }[] },
  ) {
    return this.request<void>("/students/skills", {
      method: "PUT",
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
    formData.append("file", file);
    formData.append("type", type);

    const res = await fetch(`${this.baseUrl}/students/documents`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!res.ok) {
      const error = await res
        .json()
        .catch(() => ({ message: "Upload failed" }));
      throw new Error(error.message || `HTTP ${res.status}`);
    }
    return res.json();
  }

  // Student Profile
  async getProfile(token: string) {
    if (token === "mock-student-token") {
      // Return stored mock profile or generate default
      const stored = localStorage.getItem("mock_user");
      const user = stored ? JSON.parse(stored) : {};
      return {
        fullName: user.fullName || "Demo Student",
        email: user.email || "student@demo.com",
        educationLevel: user.educationLevel || "Bachelors",
        university: user.university || "Not specified",
        locationCity: user.locationCity || "Bangalore",
        locationState: user.locationState || "Karnataka",
        linkedinUrl: user.linkedinUrl || "",
        interests: user.interests || ["AI/ML", "Web Development", "Cloud Computing"],
        skills: user.skills || [
          { id: 1, name: "Python", proficiency: 4 },
          { id: 2, name: "React", proficiency: 3 },
          { id: 3, name: "Machine Learning", proficiency: 3 },
          { id: 4, name: "JavaScript", proficiency: 4 },
          { id: 5, name: "SQL", proficiency: 3 },
        ],
        profileCompleteness: user.profileCompleteness || 72,
        hasCv: user.hasCv || false,
        recommendationLetterCount: user.recommendationLetterCount || 0,
      };
    }
    return this.request<any>("/student/profile", { token });
  }

  async getDocuments(token: string) {
    if (token === "mock-student-token") return [];
    return this.request<any[]>("/students/documents", { token });
  }

  async deleteDocument(token: string, id: string) {
    return this.request<void>(`/students/documents/${id}`, {
      method: "DELETE",
      token,
    });
  }

  // Internships
  async searchInternships(
    params: {
      page?: number;
      size?: number;
      q?: string;
      category?: string;
      state?: string;
      workMode?: string;
    } = {},
  ) {
    const query = new URLSearchParams();

    if (params.page !== undefined) query.set("page", params.page.toString());
    if (params.size !== undefined) query.set("size", params.size.toString());
    if (params.q) query.set("q", params.q);
    if (params.category) query.set("category", params.category);
    if (params.state) query.set("state", params.state);
    if (params.workMode) query.set("workMode", params.workMode);

    return this.request<any>(`/internships?${query.toString()}`);
  }

  async getInternship(id: string) {
    return this.request<any>(`/internships/${id}`);
  }

  // Applications
  async apply(token: string, internshipId: string, coverNote?: string) {
    if (token === "mock-student-token") {
      return { id: `app-${Date.now()}`, internship: { id: internshipId }, status: "pending", appliedAt: new Date().toISOString(), coverNote };
    }
    return this.request<any>(`/internships/${internshipId}/apply`, {
      method: "POST",
      body: JSON.stringify({ coverNote }),
      token,
    });
  }

  async withdraw(token: string, internshipId: string) {
    if (token === "mock-student-token") return;
    return this.request<void>(`/internships/${internshipId}/apply`, {
      method: "DELETE",
      token,
    });
  }

  async getMyApplications(token: string, page = 0, size = 20) {
    if (token === "mock-student-token") {
      return { content: [], totalElements: 0, totalPages: 0 };
    }
    const res = await this.request<any>(
      `/applications/my?page=${page}&size=${size}`,
      { token },
    );
    return res;
  }

  async getInternshipApplications(
    token: string,
    internshipId: string,
    page = 0,
    size = 20,
  ) {
    return this.request<any>(
      `/internships/${internshipId}/applications?page=${page}&size=${size}`,
      { token },
    );
  }

  async updateApplicationStatus(
    token: string,
    applicationId: string,
    status: string,
  ) {
    return this.request<any>(`/applications/${applicationId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
      token,
    });
  }

  // Provider Internship Management
  async createInternship(token: string, data: any) {
    return this.request<any>("/internships", {
      method: "POST",
      body: JSON.stringify(data),
      token,
    });
  }

  async getMyInternships(token: string, page = 0, size = 20) {
    return this.request<any>(`/internships/my?page=${page}&size=${size}`, {
      token,
    });
  }

  async getRecommendations(token: string, limit = 10) {
    if (token === "mock-student-token") {
      // Import mock internships for demo recommendations
      const { MOCK_INTERNSHIPS } = await import("@/lib/mockInternships");
      const items = MOCK_INTERNSHIPS.slice(0, limit).map((m, i) => ({
        internship_id: m.id,
        title: m.title,
        company: m.provider.companyName,
        category: m.category,
        location: m.locationCity,
        workMode: m.workMode,
        stipendMin: m.stipendMin,
        stipendMax: m.stipendMax,
        score: Math.max(0.70, 0.98 - (i * 0.04)),
        explanation: {
          reason: `Strong alignment with your profile based on ${m.category} skills. ${m.workMode === 'remote' ? 'Remote work available.' : 'Located in your preferred area.'}`,
          matchedSkills: (m.skills || []).filter((s: any) => s.importance === 'required').slice(0, 3).map((s: any) => s.name),
          missingSkills: (m.skills || []).filter((s: any) => s.importance === 'bonus').slice(0, 2).map((s: any) => s.name),
          strategy: 'content_based',
        },
      }));
      return { items };
    }
    return this.request<any>(`/recommendations?limit=${limit}`, { token });
  }

  // Provider Specific (P1.9)
  async getProviderInternships(token: string) {
    if (token === "mock-provider-token") {
      return { content: [], totalElements: 0, totalPages: 0 };
    }
    return this.request<any>("/internships/my?size=100", { token });
  }

  async getApplicants(token: string, internshipId: string) {
    return this.request<any>(
      `/internships/${internshipId}/applications?size=100`,
      { token },
    );
  }

  // Admin
  async getAdminStats(token: string) {
    return this.request<any>("/admin/stats", { token });
  }

  async getAdminFairnessStats(token: string) {
    return this.request<any>("/admin/fairness/stats", { token });
  }

  async getUsers(token: string, page = 0, size = 10) {
    return this.request<any>(`/admin/users?page=${page}&size=${size}`, {
      token,
    });
  }

  async banUser(token: string, userId: string) {
    return this.request<void>(`/admin/users/${userId}/ban`, {
      method: "PATCH",
      token,
    });
  }

  async unbanUser(token: string, userId: string) {
    return this.request<void>(`/admin/users/${userId}/unban`, {
      method: "PATCH",
      token,
    });
  }

  async getAuditLogs(token: string, page = 0, size = 10) {
    return this.request<any>(`/admin/audit-logs?page=${page}&size=${size}`, {
      token,
    });
  }

  // ── Admin Internship Management ─────────────────────────
  async getAdminInternships(
    token: string,
    page = 0,
    size = 10,
    status?: string,
  ) {
    const statusParam = status ? `&status=${status}` : "";
    return this.request<any>(
      `/admin/internships?page=${page}&size=${size}${statusParam}`,
      { token },
    );
  }

  async adminUpdateInternshipStatus(
    token: string,
    internshipId: string,
    status: string,
  ) {
    return this.request<any>(`/admin/internships/${internshipId}/status`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ status }),
    });
  }

  async adminDeleteInternship(token: string, internshipId: string) {
    return this.request<void>(`/admin/internships/${internshipId}`, {
      method: "DELETE",
      token,
    });
  }

  // ── Student Profile ─────────────────────────────────────
  async updateProfile(token: string, data: any) {
    if (token === "mock-student-token") {
      const stored = localStorage.getItem("mock_user");
      const user = stored ? JSON.parse(stored) : {};
      Object.assign(user, data);
      // Recalculate profile completeness
      let score = 0;
      if (user.fullName) score += 20;
      if (user.university && user.university !== 'Not specified') score += 20;
      if ((user.skills || []).length >= 3) score += 20;
      if (user.hasCv) score += 20;
      if ((user.interests || []).length > 0) score += 10;
      if (user.linkedinUrl) score += 10;
      user.profileCompleteness = score;
      localStorage.setItem("mock_user", JSON.stringify(user));
      return user;
    }
    return this.request<any>("/student/profile", {
      method: "PUT",
      body: JSON.stringify(data),
      token,
    });
  }

  async updateSkills(token: string, data: { skills: { skillId: number; proficiency: number; name?: string }[] }) {
    if (token === "mock-student-token") {
      // Persist skills into mock_user so getProfile returns them
      const stored = localStorage.getItem("mock_user");
      const user = stored ? JSON.parse(stored) : {};
      user.skills = data.skills.map(s => ({ id: s.skillId, name: (s as any).name || `Skill ${s.skillId}`, proficiency: s.proficiency }));
      // Recalculate completeness
      let score = 0;
      if (user.fullName) score += 20;
      if (user.university && user.university !== 'Not specified') score += 20;
      if ((user.skills || []).length >= 3) score += 20;
      if (user.hasCv) score += 20;
      if ((user.interests || []).length > 0) score += 10;
      if (user.linkedinUrl) score += 10;
      user.profileCompleteness = score;
      localStorage.setItem("mock_user", JSON.stringify(user));
      return { success: true };
    }
    return this.request<any>("/student/skills", {
      method: "PUT",
      body: JSON.stringify(data),
      token,
    });
  }

  async uploadDocument(token: string, file: File, type: string) {
    if (token === "mock-student-token") {
      // Mark hasCv in localStorage if uploading a CV
      if (type === 'CV') {
        const stored = localStorage.getItem("mock_user");
        const user = stored ? JSON.parse(stored) : {};
        user.hasCv = true;
        // Recalculate completeness
        let score = 0;
        if (user.fullName) score += 20;
        if (user.university && user.university !== 'Not specified') score += 20;
        if ((user.skills || []).length >= 3) score += 20;
        if (user.hasCv) score += 20;
        if ((user.interests || []).length > 0) score += 10;
        if (user.linkedinUrl) score += 10;
        user.profileCompleteness = score;
        localStorage.setItem("mock_user", JSON.stringify(user));
      }
      return { id: `doc-${Date.now()}`, filename: file.name, type, uploadedAt: new Date().toISOString() };
    }
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);
    return fetch(`${this.baseUrl}/student/documents`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    }).then(r => {
      if (!r.ok) throw new Error("Upload failed");
      return r.json();
    });
  }

  async searchSkills(query: string) {
    try {
      return await this.request<any[]>(`/skills?q=${encodeURIComponent(query)}`);
    } catch {
      // Fallback: return common skills matching the query
      const commonSkills = [
        "Python", "Java", "JavaScript", "TypeScript", "React", "Angular", "Vue.js",
        "Node.js", "Express", "Django", "Flask", "Spring Boot", "SQL", "PostgreSQL",
        "MongoDB", "Redis", "Docker", "Kubernetes", "AWS", "Azure", "GCP",
        "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "NLP",
        "Data Science", "Pandas", "NumPy", "R", "Tableau", "Power BI",
        "HTML", "CSS", "Tailwind CSS", "Figma", "UI/UX Design",
        "Git", "Linux", "CI/CD", "REST API", "GraphQL",
        "Swift", "Kotlin", "Flutter", "React Native", "iOS", "Android",
        "Cybersecurity", "Ethical Hacking", "Penetration Testing",
        "Blockchain", "Solidity", "Web3", "Cloud Computing",
        "Full Stack Development", "DevOps", "Agile", "Scrum",
        "C++", "C#", ".NET", "Rust", "Go", "Scala",
      ];
      const q = query.toLowerCase();
      return commonSkills
        .filter(s => s.toLowerCase().includes(q))
        .map((name, i) => ({ id: i + 1, name }));
    }
  }

  async updateLocale(token: string, locale: string) {
    if (token === "mock-student-token" || token === "mock-provider-token") return;
    return this.request<void>("/user/locale", {
      method: "PATCH",
      body: JSON.stringify({ locale }),
      token,
    });
  }
}

export const api = new ApiClient(API_URL);
