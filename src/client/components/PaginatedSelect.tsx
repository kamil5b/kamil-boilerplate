"use client";

import { useState, useEffect, useRef } from "react";
import { fetchPaginated } from "@/client/helpers";
import { useDebounce } from "@/client/hooks";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { X, ChevronDown, Check } from "lucide-react";
import { cn } from "@/client/utils";
import { Label } from "./ui/label";

interface PaginatedSelectProps<T> {
  endpoint: string;
  value: string;
  onChange: (value: string) => void;
  displayValue: (item: T) => string;
  filterValue?: (item: T) => string;
  getId: (item: T) => string;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  allowClear?: boolean;
  extraParams?: Record<string, any>;
  pageSize?: number;
}

export function PaginatedSelect<T>({
  endpoint,
  value,
  onChange,
  displayValue,
  filterValue,
  getId,
  placeholder = "Select...",
  label,
  disabled = false,
  allowClear = false,
  extraParams = {},
  pageSize = 20,
}: PaginatedSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<T[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState("");
  
  const debouncedSearch = useDebounce(search, 300);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  // Load initial data and when search changes
  useEffect(() => {
    setPage(1);
    setItems([]);
    loadData(1, true);
  }, [debouncedSearch, endpoint, JSON.stringify(extraParams)]);

  // Load more data when page changes (infinite scroll)
  useEffect(() => {
    if (page > 1) {
      loadData(page, false);
    }
  }, [page]);

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget && open) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loading, open]);

  // Update selected label when value changes
  useEffect(() => {
    if (value && items.length > 0) {
      const selectedItem = items.find((item) => getId(item) === value);
      if (selectedItem) {
        setSelectedLabel(displayValue(selectedItem));
      }
    } else if (!value) {
      setSelectedLabel("");
    }
  }, [value, items, getId, displayValue]);

  const loadData = async (pageNum: number, replace: boolean) => {
    setLoading(true);
    try {
      const response = await fetchPaginated<T>(
        endpoint,
        pageNum,
        pageSize,
        debouncedSearch,
        extraParams
      );
      
      if (replace) {
        setItems(response.items);
      } else {
        setItems((prev) => [...prev, ...response.items]);
      }
      
      setHasMore(pageNum < response.meta.totalPages);
    } catch (error) {
      console.error("Failed to load data:", error);
      setItems([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (item: T) => {
    const itemValue = getId(item);
    const itemLabel = displayValue(item);
    onChange(itemValue);
    setSelectedLabel(itemLabel);
    setOpen(false);
    setSearch("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setSelectedLabel("");
  };

  const getFilterText = (item: T): string => {
    return filterValue ? filterValue(item) : displayValue(item);
  };

  const filteredItems = search
    ? items.filter((item) =>
        getFilterText(item).toLowerCase().includes(search.toLowerCase())
      )
    : items;

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <div className="relative" ref={dropdownRef}>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
          onClick={() => !disabled && setOpen(!open)}
        >
          <span className="truncate">{selectedLabel || placeholder}</span>
          <div className="flex items-center gap-1">
            {allowClear && value && !disabled && (
              <X
                className="h-4 w-4 shrink-0 opacity-50 hover:opacity-100"
                onClick={handleClear}
              />
            )}
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>

        {open && (
          <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg">
            <div className="p-2 border-b">
              <Input
                placeholder={`Search ${label || "items"}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>
            <div
              ref={listRef}
              className="max-h-60 overflow-y-auto"
            >
              {filteredItems.length === 0 && !loading ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No items found
                </div>
              ) : (
                <>
                  {filteredItems.map((item) => {
                    const itemValue = getId(item);
                    const itemLabel = displayValue(item);
                    const isSelected = value === itemValue;
                    
                    return (
                      <button
                        key={itemValue}
                        type="button"
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent cursor-pointer",
                          isSelected && "bg-accent"
                        )}
                        onClick={() => handleSelect(item)}
                      >
                        <Check
                          className={cn(
                            "h-4 w-4 shrink-0",
                            isSelected ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span className="truncate">{itemLabel}</span>
                      </button>
                    );
                  })}
                  {hasMore && (
                    <div
                      ref={observerTarget}
                      className="py-2 text-center text-sm text-muted-foreground"
                    >
                      {loading ? "Loading more..." : "Scroll for more"}
                    </div>
                  )}
                </>
              )}
              {loading && filteredItems.length === 0 && (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Loading...
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
