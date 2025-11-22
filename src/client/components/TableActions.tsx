"use client";

import { Button } from "./ui/button";
import { Eye, Pencil, Trash2 } from "lucide-react";

interface TableActionsProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function TableActions({ onView, onEdit, onDelete }: TableActionsProps) {
  return (
    <div className="flex items-center justify-end gap-2">
      {onView && (
        <Button variant="ghost" size="icon" onClick={onView}>
          <Eye className="h-4 w-4" />
        </Button>
      )}
      {onEdit && (
        <Button variant="ghost" size="icon" onClick={onEdit}>
          <Pencil className="h-4 w-4" />
        </Button>
      )}
      {onDelete && (
        <Button variant="ghost" size="icon" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
