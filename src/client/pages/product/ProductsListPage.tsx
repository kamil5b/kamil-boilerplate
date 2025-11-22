"use client";

import type { ProductResponse } from "@/shared";
import { ListPageTemplate } from "@/client/template";
import { Badge } from "@/client/components/ui/badge";
import { formatDateTime } from "@/client/helpers";
import { AccessPermission } from "@/shared/enums";

interface ProductsListPageProps {
  onEdit: (id: string) => void;
  onCreate: () => void;
}

const getTypeColor = (type: string) => {
  switch (type) {
    case "SELLABLE": return "bg-green-500";
    case "ASSET": return "bg-blue-500";
    case "UTILITY": return "bg-yellow-500";
    case "PLACEHOLDER": return "bg-gray-500";
    default: return "bg-gray-500";
  }
};

export function ProductsListPage({ onEdit, onCreate }: ProductsListPageProps) {
  return (
    <ListPageTemplate<ProductResponse>
      title="Products"
      menuPermission={AccessPermission.MENU_PRODUCT}
      createPermission={AccessPermission.CREATE_PRODUCT}
      editPermission={AccessPermission.EDIT_PRODUCT}
      deletePermission={AccessPermission.DELETE_PRODUCT}
      apiEndpoint="/api/products"
      searchPlaceholder="Search products..."
      createButtonText="Create Product"
      onEdit={onEdit}
      onCreate={onCreate}
      columns={[
        { header: "Name", accessor: (product) => product.name, className: "font-medium" },
        { 
          header: "Type", 
          accessor: (product) => (
            <Badge className={getTypeColor(product.type)}>{product.type}</Badge>
          )
        },
        { header: "Description", accessor: (product) => product.description },
        { header: "Created At", accessor: (product) => formatDateTime(product.createdAt) },
      ]}
      getDeleteConfirmMessage={(product) => `Are you sure you want to delete product "${product.name}"?`}
    />
  );
}
