import { useAuthStore } from "@/stores/authStore";

const API_URL = "https://api.savewithfolio.com/v4";

// Simple API client that automatically includes auth headers
class ApiClient {
  private getAuthHeaders() {
    const token = useAuthStore.getState().token;
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_URL}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Request failed" }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    // Handle 204 No Content (like delete account)
    if (response.status === 204) {
      return null;
    }

    return response.json();
  }

  get(endpoint: string) {
    return this.request(endpoint, { method: "GET" });
  }

  post(endpoint: string, data?: any) {
    return this.request(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  put(endpoint: string, data?: any) {
    return this.request(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  delete(endpoint: string) {
    return this.request(endpoint, { method: "DELETE" });
  }
}

export const api = new ApiClient();

// Specific API functions
export const checkWaybackAvailable = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(
      `https://archive.org/wayback/available?url=${encodeURIComponent(url)}`,
    );
    const data = await response.json();
    return !!data.archived_snapshots?.closest?.available;
  } catch (error) {
    console.error("Wayback check failed:", error);
    return false;
  }
};
