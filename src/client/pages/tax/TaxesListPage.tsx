"use client";

import type { TaxResponse } from "@/shared";
import { ListPageTemplate } from "@/client/template";
import { formatDateTime } from "@/client/helpers";
import { AccessPermission } from "@/shared/enums";

interface TaxesListPageProps {
  onEdit: (id: string) => void;
  onCreate: () => void;
}

export function TaxesListPage({ onEdit, onCreate }: TaxesListPageProps) {
  return (
    <ListPageTemplate<TaxResponse>
      title="Taxes"
      menuPermission={AccessPermission.MENU_TAX}
      createPermission={AccessPermission.CREATE_TAX}
      editPermission={AccessPermission.EDIT_TAX}
      deletePermission={AccessPermission.DELETE_TAX}
      apiEndpoint="/api/taxes"
      searchPlaceholder="Search taxes..."
      createButtonText="Create Tax"
      onEdit={onEdit}
      onCreate={onCreate}
      columns={[
        { header: "Name", accessor: (tax) => tax.name, className: "font-medium" },
        { header: "Value (%)", accessor: (tax) => `${tax.value}%` },
        { header: "Remark", accessor: (tax) => tax.remark || "-" },
        { header: "Created At", accessor: (tax) => formatDateTime(tax.createdAt) },
      ]}
      getDeleteConfirmMessage={(tax) => `Are you sure you want to delete tax "${tax.name}"?`}
    />
  );
}
