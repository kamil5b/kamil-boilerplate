"use client";

import type { UnitQuantityResponse } from "@/shared";
import { ListPageTemplate } from "@/client/template";
import { formatDateTime } from "@/client/helpers";
import { AccessPermission } from "@/shared/enums";

interface UnitQuantitiesListPageProps {
  onEdit: (id: string) => void;
  onCreate: () => void;
}

export function UnitQuantitiesListPage({ onEdit, onCreate }: UnitQuantitiesListPageProps) {
  return (
    <ListPageTemplate<UnitQuantityResponse>
      title="Unit Quantities"
      menuPermission={AccessPermission.MENU_UNIT_QUANTITY}
      createPermission={AccessPermission.CREATE_UNIT_QUANTITY}
      editPermission={AccessPermission.EDIT_UNIT_QUANTITY}
      deletePermission={AccessPermission.DELETE_UNIT_QUANTITY}
      apiEndpoint="/api/unit-quantities"
      searchPlaceholder="Search unit quantities..."
      createButtonText="Create Unit Quantity"
      onEdit={onEdit}
      onCreate={onCreate}
      columns={[
        { header: "Name", accessor: (uq) => uq.name, className: "font-medium" },
        { header: "Remark", accessor: (uq) => uq.remark || "-" },
        { header: "Created At", accessor: (uq) => formatDateTime(uq.createdAt) },
        { header: "Updated At", accessor: (uq) => formatDateTime(uq.updatedAt) },
      ]}
      getDeleteConfirmMessage={(uq) => `Are you sure you want to delete unit quantity "${uq.name}"?`}
    />
  );
}
