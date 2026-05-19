import api from "./api";
import type { User, LoginPayload, RegisterPayload } from "@/types";

interface AuthResponse {
  accessToken: string;
  user: User;
}

export const authService = {
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>("/auth/register", payload);
    return data;
  },

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>("/auth/login", payload);
    return data;
  },

  async logout(): Promise<void> {
    await api.post("/auth/logout");
  },

  async me(): Promise<User> {
    const { data } = await api.get<{ user: User }>("/auth/me");
    return data.user;
  },

  async refresh(): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>("/auth/refresh");
    return data;
  },
};