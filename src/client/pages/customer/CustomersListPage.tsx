"use client";

import type { CustomerResponse } from "@/shared";
import { ListPageTemplate } from "@/client/template";
import { formatDateTime } from "@/client/helpers";
import { AccessPermission } from "@/shared/enums";

interface CustomersListPageProps {
  onEdit: (id: string) => void;
  onCreate: () => void;
}

export function CustomersListPage({ onEdit, onCreate }: CustomersListPageProps) {
  return (
    <ListPageTemplate<CustomerResponse>
      title="Customers"
      menuPermission={AccessPermission.MENU_CUSTOMER}
      createPermission={AccessPermission.CREATE_CUSTOMER}
      editPermission={AccessPermission.EDIT_CUSTOMER}
      deletePermission={AccessPermission.DELETE_CUSTOMER}
      apiEndpoint="/api/customers"
      searchPlaceholder="Search customers..."
      createButtonText="Create Customer"
      onEdit={onEdit}
      onCreate={onCreate}
      columns={[
        { header: "Name", accessor: (customer) => customer.name, className: "font-medium" },
        { header: "Phone Number", accessor: (customer) => customer.phoneNumber },
        { header: "Email", accessor: (customer) => customer.email || "-" },
        { header: "Address", accessor: (customer) => customer.address || "-" },
        { header: "Created At", accessor: (customer) => formatDateTime(customer.createdAt) },
      ]}
      getDeleteConfirmMessage={(customer) => `Are you sure you want to delete customer "${customer.name}"?`}
    />
  );
}
