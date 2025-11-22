"use client";

import { useState, useEffect, useCallback } from "react";
import { useDebounce } from "./useDebounce";
import type { PaginatedResponse } from "@/shared/response";

interface UsePaginationOptions<T> {
  fetchFn: (page: number, limit: number, search?: string) => Promise<PaginatedResponse<T>>;
  initialPage?: number;
  initialLimit?: number;
}

export function usePagination<T>({
  fetchFn,
  initialPage = 1,
  initialLimit = 10,
}: UsePaginationOptions<T>) {
  const [data, setData] = useState<T[]>([]);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const debouncedSearch = useDebounce(search, 300);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetchFn(page, initialLimit, debouncedSearch || undefined);
      setData(response.items);
      setTotalPages(response.meta.totalPages);
      setTotalItems(response.meta.totalItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, fetchFn, initialLimit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    // Reset to page 1 when search changes
    if (page !== 1) {
      setPage(1);
    }
  }, [debouncedSearch]);

  const refresh = () => fetchData();

  const nextPage = () => {
    if (page < totalPages) setPage(page + 1);
  };

  const prevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const goToPage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  return {
    data,
    page,
    totalPages,
    totalItems,
    search,
    setSearch,
    isLoading,
    error,
    refresh,
    nextPage,
    prevPage,
    goToPage,
  };
}
