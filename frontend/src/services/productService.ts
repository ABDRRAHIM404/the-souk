import api from "./api";
import type { Product, ProductFilters, PaginatedResponse, Review } from "@/types";

export const productService = {
  async getAll(filters: ProductFilters = {}): Promise<PaginatedResponse<Product>> {
    const { data } = await api.get<PaginatedResponse<Product>>("/products", { params: filters });
    return data;
  },

  async getById(id: string): Promise<Product> {
    const { data } = await api.get<{ data: Product }>(`/products/${id}`);
    return data.data;
  },

  async create(payload: FormData): Promise<Product> {
    const { data } = await api.post<{ data: Product }>("/products", payload, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data;
  },

  async update(id: string, payload: Partial<Product>): Promise<Product> {
    const { data } = await api.put<{ data: Product }>(`/products/${id}`, payload);
    return data.data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/products/${id}`);
  },

  async uploadImages(id: string, formData: FormData): Promise<Product> {
    const { data } = await api.post<{ data: Product }>(`/products/${id}/images`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data;
  },

async getReviews(id: string): Promise<Review[]> {
    const { data } = await api.get<{ data: Review[] }>(`/products/${id}/reviews`);
    return data.data;
  },

  async createReview(id: string, payload: { rating: number; comment: string; photo?: string }): Promise<Review> {
    const { data } = await api.post<{ data: Review }>(`/products/${id}/reviews`, payload);
    return data.data;
  },

  async deleteReview(reviewId: string): Promise<void> {
    await api.delete(`/reviews/${reviewId}`);
  },

  async addToWishlist(productId: string): Promise<void> {
    await api.post(`/users/wishlist/${productId}`);
  },

  async removeFromWishlist(productId: string): Promise<void> {
    await api.delete(`/users/wishlist/${productId}`);
  },

};