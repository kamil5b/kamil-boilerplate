"use client";

import type { InventoryHistoryResponse } from "@/shared";
import { ListPageTemplate } from "@/client/template";
import { formatDateTime } from "@/client/helpers";
import { AccessPermission } from "@/shared/enums";

interface InventoryHistoriesListPageProps {
  onManipulate: () => void;
}

export function InventoryHistoriesListPage({ onManipulate }: InventoryHistoriesListPageProps) {
  return (
    <ListPageTemplate<InventoryHistoryResponse>
      title="Inventory History"
      menuPermission={AccessPermission.MENU_INVENTORY}
      createPermission={AccessPermission.MANIPULATE_INVENTORY}
      apiEndpoint="/api/inventory-histories"
      searchPlaceholder="Search inventory histories..."
      createButtonText="Manipulate Inventory"
      onCreate={onManipulate}
      columns={[
        { header: "Product", accessor: (history) => history.productName, className: "font-medium" },
        { 
          header: "Quantity", 
          accessor: (history) => {
            const sign = history.quantity > 0 ? "+" : "";
            return (
              <span className={history.quantity < 0 ? "text-red-500" : "text-green-500"}>
                {sign}{history.quantity}
              </span>
            );
          },
          className: "font-mono"
        },
        { header: "Unit", accessor: (history) => history.unitQuantityName },
        { header: "Remark", accessor: (history) => history.remark || "-" },
        { header: "Created At", accessor: (history) => formatDateTime(history.createdAt) },
        { header: "Created By", accessor: (history) => history.createdByName || "-" },
      ]}
      getDeleteConfirmMessage={() => "Inventory histories cannot be deleted"}
    />
  );
}
