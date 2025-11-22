import type { PaginatedResponse, DataResponse } from "@/shared/response";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
}

export async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: "An error occurred",
    }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function fetchPaginated<T>(
  endpoint: string,
  page: number,
  limit: number,
  search?: string,
  extraParams?: Record<string, any>
): Promise<PaginatedResponse<T>> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (search) {
    params.append("search", search);
  }

  if (extraParams) {
    Object.entries(extraParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach((v) => params.append(key, v.toString()));
        } else {
          params.append(key, value.toString());
        }
      }
    });
  }

  return apiRequest<PaginatedResponse<T>>(`${endpoint}?${params.toString()}`);
}

export async function fetchById<T>(
  endpoint: string,
  id: string
): Promise<T> {
  const response = await apiRequest<DataResponse<T>>(`${endpoint}/${id}`);
  return response.data;
}

export async function createResource<T, D>(
  endpoint: string,
  data: D
): Promise<T> {
  const response = await apiRequest<DataResponse<T>>(endpoint, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return response.data;
}

export async function updateResource<T, D>(
  endpoint: string,
  id: string,
  data: D
): Promise<T> {
  const response = await apiRequest<DataResponse<T>>(`${endpoint}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return response.data;
}

export async function deleteResource(
  endpoint: string,
  id: string
): Promise<void> {
  await apiRequest(`${endpoint}/${id}`, {
    method: "DELETE",
  });
}
