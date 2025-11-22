"use client";

import { Button } from "./ui/button";
import { Plus } from "lucide-react";

interface PageHeaderProps {
  title: string;
  onCreateClick?: () => void;
  createButtonText?: string;
}

export function PageHeader({
  title,
  onCreateClick,
  createButtonText = "Create",
}: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      {onCreateClick && (
        <Button onClick={onCreateClick}>
          <Plus className="mr-2 h-4 w-4" />
          {createButtonText}
        </Button>
      )}
    </div>
  );
}
