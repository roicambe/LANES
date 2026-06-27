import { apiClient } from "@/shared/api";

export const authApi = {
  login: async (credentials: any) => {
    // return apiClient.post("/api/v1/auth/login", credentials);
  },
  signup: async (data: any) => {
    // return apiClient.post("/api/v1/auth/signup", data);
  }
};
