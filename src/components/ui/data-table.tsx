'use client';

import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  Table as TableType,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table';
import {LucideIcon} from 'lucide-react';
import * as React from 'react';

import {DataTablePagination} from '@/components/ui/data-table-pagination';
import {DataTableViewOptions} from '@/components/ui/data-table-view-options';
import {Input} from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  customFilters?: ((table: TableType<TData>) => React.ReactNode)[];
  data: TData[];
  filters?: {icon?: LucideIcon; id: string; placeholder?: string}[];
  fullWidth?: boolean;
  initialSortingState?: SortingState;
  manualFiltering?: boolean;
  manualPagination?: boolean;
  onPageChange?: (pageIndex: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  packageCount?: number;
  pageCount?: number;
  shrinkFirstColumn?: boolean;
  viewOptionsAdditionalItems?: React.ReactNode;
}

export function DataTable<TData, TValue>({
  columns,
  customFilters,
  data,
  filters,
  fullWidth = false,
  initialSortingState = [],
  manualFiltering = false,
  manualPagination = false,
  onPageChange,
  onPageSizeChange,
  packageCount,
  pageCount,
  shrinkFirstColumn = false,
  viewOptionsAdditionalItems = null,
}: Readonly<DataTableProps<TData, TValue>>) {
  const [sorting, setSorting] =
    React.useState<SortingState>(initialSortingState);
  console.log(sorting);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: manualFiltering ? undefined : getFilteredRowModel(),
    getPaginationRowModel: manualPagination
      ? undefined
      : getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
    manualFiltering,
    manualPagination,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    pageCount,
    rowCount: packageCount ?? undefined,
    state: {
      columnFilters,
      columnVisibility,
      rowSelection,
      sorting,
    },
  });

  return (
    <div
      className={
        fullWidth
          ? 'flex flex-col gap-y-4 w-full'
          : 'flex flex-col gap-y-4 max-w-7xl w-full'
      }
    >
      <div className="flex items-center py-2 gap-x-2">
        {filters?.map(x => (
          <Input
            className="max-w-xs"
            icon={x.icon}
            key={x.id}
            onChange={event =>
              table.getColumn(x.id)?.setFilterValue(event.target.value)
            }
            placeholder={x.placeholder}
            value={(table.getColumn(x.id)?.getFilterValue() as string) ?? ''}
          />
        ))}
        <div className="flex gap-2">
          {customFilters?.map(filter => filter(table))}
        </div>
        {viewOptionsAdditionalItems}
        <div className="flex ml-auto gap-x-2">
          <DataTableViewOptions table={table} />
        </div>
      </div>
      <div className="rounded-md border">
        <Table className="**:data-[slot=table-head]:first:pl-4">
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => {
                  return (
                    <TableHead colSpan={header.colSpan} key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody
            className={
              shrinkFirstColumn
                ? '**:data-[slot=table-cell]:first:w-9 **:data-[slot=table-cell]:first:pl-4'
                : '**:data-[slot=table-cell]:first:pl-4'
            }
          >
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow
                  data-state={row.getIsSelected() && 'selected'}
                  key={row.id}
                >
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  className="h-24 text-center"
                  colSpan={columns.length}
                >
                  No data yet...
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        table={table}
      />
    </div>
  );
}
