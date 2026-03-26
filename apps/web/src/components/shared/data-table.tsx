import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/**
 * Interface defining a single column in the DataTable
 */
export interface ColumnDef<T> {
  /** The header content (string or ReactNode) */
  header: ReactNode;
  /** The key from the data object to display (optional, use if `cell` is not provided) */
  accessorKey?: keyof T;
  /** Custom data accessor function (optional) */
  accessorFn?: (item: T) => ReactNode;
  /** Custom render function for the cell (optional, overrides `accessorKey`) */
  cell?: (item: T) => ReactNode;
  /** Additional CSS classes for the column (e.g., "text-right" or "w-[200px]") */
  className?: string;
}

/**
 * Props for the DataTable component
 */
export interface DataTableProps<T> {
  /** Array of data objects to display */
  data: T[];
  /** Array of column definitions */
  columns: ColumnDef<T>[];
  /** Loading state indicator */
  isLoading?: boolean;
  /** Configuration for the empty state when no data is available */
  emptyState?: {
    icon?: LucideIcon;
    title: string;
    description?: string;
  };
  /** Custom key extractor function for rows (defaults to `item.id` or array index) */
  keyExtractor?: (item: T, index: number) => string | number;
}

/**
 * A highly reusable generic data table component.
 * Standardizes the display of tabular data, loading skeletons, and empty states.
 *
 * @example
 * ```tsx
 * const columns: ColumnDef<User>[] = [
 *   { header: "Name", accessorKey: "fullName" },
 *   { header: "Role", cell: (user) => <Badge>{user.role}</Badge> }
 * ];
 * 
 * <DataTable 
 *   data={users} 
 *   columns={columns} 
 *   isLoading={isLoading}
 *   emptyState={{ icon: Users, title: "No users found" }}
 * />
 * ```
 */
export function DataTable<T>({
  data,
  columns,
  isLoading,
  emptyState,
  keyExtractor,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (data.length === 0 && emptyState) {
    const Icon = emptyState.icon;
    return (
      <div className="text-center py-8 text-muted-foreground">
        {Icon && <Icon className="h-12 w-12 mx-auto mb-3 opacity-50" />}
        <p>{emptyState.title}</p>
        {emptyState.description && (
          <p className="text-sm">{emptyState.description}</p>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {columns?.map((col, idx) => (
              <TableHead key={idx} className={col.className}>
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.map((item, rowIdx) => {
            const rowKey = keyExtractor
              ? keyExtractor(item, rowIdx)
              : // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (item as any).id || rowIdx;
            
            return (
              <TableRow key={rowKey}>
                {columns.map((col, colIdx) => (
                  <TableCell key={colIdx} className={col.className}>
                    {col.cell
                      ? col.cell(item)
                      : col.accessorFn
                        ? col.accessorFn(item)
                        : col.accessorKey
                          ? (item[col.accessorKey] as ReactNode)
                          : null}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
