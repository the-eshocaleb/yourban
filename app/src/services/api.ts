const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8080/";
export interface ApiResponse<T = any> {
  ok: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: string[];
}

class ApiService {
  private serializeBody(body: unknown): string {
    return typeof body === "string" ? body : JSON.stringify(body);
  }

  async get<T = any>(path: string): Promise<ApiResponse<T>> {
    const res = await fetch(`${API_URL}${path}`, {
      mode: "cors",
      method: "GET",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    const response = await res.json();
    return response as ApiResponse<T>;
  }

  async post<T = any>(path: string, body: unknown): Promise<ApiResponse<T>> {
    const res = await fetch(`${API_URL}${path}`, {
      mode: "cors",
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: this.serializeBody(body),
    });
    const response = await res.json();
    return response as ApiResponse<T>;
  }

  async put<T = any>(path: string, body: unknown): Promise<ApiResponse<T>> {
    const res = await fetch(`${API_URL}${path}`, {
      mode: "cors",
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: this.serializeBody(body),
    });
    const response = await res.json();
    return response as ApiResponse<T>;
  }

  async delete<T = any>(path: string): Promise<ApiResponse<T>> {
    const res = await fetch(`${API_URL}${path}`, {
      mode: "cors",
      method: "DELETE",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    if (res.status === 204) {
      return { ok: true } as ApiResponse<T>;
    }
    const text = await res.text();
    if (!text.trim()) {
      return { ok: res.ok } as ApiResponse<T>;
    }
    try {
      return JSON.parse(text) as ApiResponse<T>;
    } catch {
      return { ok: res.ok, message: text } as ApiResponse<T>;
    }
  }
}

const API = new ApiService();
export default API;
