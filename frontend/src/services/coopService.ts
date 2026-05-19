import api from "./api";
import type { Cooperative, UpdateCoopPayload, ApiResponse, PaginatedResponse } from "@/types";

export const coopService = {
  async getAll(): Promise<PaginatedResponse<Cooperative>> {
    const { data } = await api.get<PaginatedResponse<Cooperative>>("/coops");
    return data;
  },

  async getById(id: string): Promise<Cooperative> {
    const { data } = await api.get<{ data: Cooperative }>(`/coops/${id}`);
    return data.data;
  },

  async create(payload: Partial<Cooperative>): Promise<Cooperative> {
    const { data } = await api.post<{ data: Cooperative }>("/coops", payload);
    return data.data;
  },

  async update(id: string, payload: UpdateCoopPayload): Promise<Cooperative> {
    const { data } = await api.put<{ data: Cooperative }>(`/coops/${id}`, payload);
    return data.data;
  },

  async follow(id: string): Promise<ApiResponse<{ followed: boolean }>> {
    const { data } = await api.post<ApiResponse<{ followed: boolean }>>(`/coops/${id}/follow`);
    return data;
  },
};