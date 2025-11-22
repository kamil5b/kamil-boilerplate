/**
 * Generic List Page Template
 * 
 * This is a reusable template for creating list pages with common features:
 * - Permission-based access control
 * - Pagination
 * - Search functionality
 * - CRUD operations (Create, Read, Update, Delete)
 * - Loading and error states
 * 
 * @example
 * ```tsx
 * import { ListPageTemplate } from "@/client/template";
 * import { AccessPermission } from "@/shared/enums";
 * import type { MyEntityResponse } from "@/shared";
 * 
 * export function MyEntitiesListPage({ onEdit, onCreate }: { onEdit: (id: string) => void; onCreate: () => void }) {
 *   return (
 *     <ListPageTemplate<MyEntityResponse>
 *       title="My Entities"
 *       menuPermission={AccessPermission.MENU_MY_ENTITY}
 *       createPermission={AccessPermission.CREATE_MY_ENTITY}
 *       editPermission={AccessPermission.EDIT_MY_ENTITY}
 *       deletePermission={AccessPermission.DELETE_MY_ENTITY}
 *       apiEndpoint="/api/my-entities"
 *       searchPlaceholder="Search entities..."
 *       createButtonText="Create Entity"
 *       onEdit={onEdit}
 *       onCreate={onCreate}
 *       columns={[
 *         { header: "Name", accessor: (item) => item.name },
 *         { header: "Status", accessor: (item) => item.status },
 *       ]}
 *       getDeleteConfirmMessage={(item) => `Are you sure you want to delete "${item.name}"?`}
 *     />
 *   );
 * }
 * ```
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePagination, usePermissions } from "@/client/hooks";
import { fetchPaginated, deleteResource } from "@/client/helpers";
import {
  PageHeader,
  SearchBar,
  Pagination,
  ErrorAlert,
  LoadingSpinner,
  TableActions,
  Protected,
} from "@/client/components";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/client/components/ui/table";
import { AccessPermission } from "@/shared/enums";

export interface ColumnConfig<T> {
  header: string;
  accessor: (item: T) => React.ReactNode;
  className?: string;
}

export interface ListPageTemplateProps<T extends { id: string }> {
  /** Page title */
  title: string;
  
  /** Permission required to access the menu/page */
  menuPermission: AccessPermission;
  
  /** Permission required to create new items (optional) */
  createPermission?: AccessPermission;
  
  /** Permission required to edit items (optional) */
  editPermission?: AccessPermission;
  
  /** Permission required to delete items (optional) */
  deletePermission?: AccessPermission;
  
  /** API endpoint for fetching data (e.g., "/api/customers") */
  apiEndpoint: string;
  
  /** Placeholder text for search input */
  searchPlaceholder: string;
  
  /** Text for the create button */
  createButtonText?: string;
  
  /** Callback when edit button is clicked */
  onEdit?: (id: string) => void;
  
  /** Callback when create button is clicked */
  onCreate?: () => void;
  
  /** Column configuration for the table */
  columns: ColumnConfig<T>[];
  
  /** Function to generate delete confirmation message */
  getDeleteConfirmMessage: (item: T) => string;
  
  /** Optional: Custom empty state message */
  emptyStateMessage?: string;
  
  /** Optional: Custom loading message */
  loadingMessage?: string;
  
  /** Optional: Redirect path when permission is denied */
  redirectPath?: string;
}

export function ListPageTemplate<T extends { id: string }>({
  title,
  menuPermission,
  createPermission,
  editPermission,
  deletePermission,
  apiEndpoint,
  searchPlaceholder,
  createButtonText = "Create",
  onEdit,
  onCreate,
  columns,
  getDeleteConfirmMessage,
  emptyStateMessage = "No items found",
  loadingMessage,
  redirectPath = "/dashboard",
}: ListPageTemplateProps<T>) {
  const router = useRouter();
  const { can, isLoading: authLoading } = usePermissions();

  useEffect(() => {
    if (authLoading) return;
    if (!can(menuPermission)) {
      router.push(redirectPath);
    }
  }, [can, authLoading, menuPermission, router, redirectPath]);

  const {
    data: items,
    page,
    totalPages,
    search,
    setSearch,
    isLoading,
    error,
    refresh,
    nextPage,
    prevPage,
  } = usePagination<T>({
    fetchFn: (page, limit, search) => fetchPaginated<T>(apiEndpoint, page, limit, search),
  });

  const handleDelete = async (item: T) => {
    const message = getDeleteConfirmMessage(item);
    if (!confirm(message)) return;

    try {
      await deleteResource(apiEndpoint, item.id);
      refresh();
    } catch (error: any) {
      alert(error.message || "Failed to delete item");
    }
  };

  const hasEditPermission = editPermission ? can(editPermission) : false;
  const hasDeletePermission = deletePermission ? can(deletePermission) : false;
  const hasCreatePermission = createPermission ? can(createPermission) : false;
  const showActionsColumn = (editPermission || deletePermission) && (hasEditPermission || hasDeletePermission);

  if (authLoading) return <LoadingSpinner message="Loading..." />;
  if (isLoading) return <LoadingSpinner message={loadingMessage || `Loading ${title.toLowerCase()}...`} />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        onCreateClick={hasCreatePermission && onCreate ? onCreate : undefined}
        createButtonText={createButtonText}
      />

      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder={searchPlaceholder}
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead key={index} className={column.className}>
                  {column.header}
                </TableHead>
              ))}
              {showActionsColumn && (
                <Protected permissions={[editPermission, deletePermission].filter(Boolean) as AccessPermission[]}>
                  <TableHead className="text-right">Actions</TableHead>
                </Protected>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + (showActionsColumn ? 1 : 0)} className="text-center text-muted-foreground">
                  {emptyStateMessage}
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  {columns.map((column, index) => (
                    <TableCell key={index} className={column.className}>
                      {column.accessor(item)}
                    </TableCell>
                  ))}
                  {showActionsColumn && (
                    <Protected permissions={[editPermission, deletePermission].filter(Boolean) as AccessPermission[]}>
                      <TableCell className="text-right">
                        <TableActions
                          onEdit={hasEditPermission && onEdit ? () => onEdit(item.id) : undefined}
                          onDelete={hasDeletePermission ? () => handleDelete(item) : undefined}
                        />
                      </TableCell>
                    </Protected>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPrevious={prevPage}
          onNext={nextPage}
        />
      )}
    </div>
  );
}
