'use client';

import {ColumnDef, Table} from '@tanstack/react-table';
import {Ellipsis, Logs, RotateCcw, Search, SquareTerminal} from 'lucide-react';
import Link from 'next/link';
import {useEffect, useMemo, useState} from 'react';
import {toast} from 'sonner';

import {listRebuildPackages} from '@/app/actions';
import Loader from '@/components/loader';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Card} from '@/components/ui/card';
import {Checkbox} from '@/components/ui/checkbox';
import {ComboBox} from '@/components/ui/combobox';
import {DataTable} from '@/components/ui/data-table';
import {DataTableColumnHeader} from '@/components/ui/data-table-column-header';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {useSidebar} from '@/components/ui/sidebar';
import {
  PackageMArch,
  packageMArchValues,
  PackageRepo,
  packageRepoValues,
  PackageStatus,
  packageStatusValues,
  RebuildPackage,
  RebuildPackageList,
} from '@/lib/typings';
import {packageStatusToIcon} from '@/lib/utils';

const columns: ColumnDef<RebuildPackage>[] = [
  {
    cell: ({row}) => (
      <Checkbox
        aria-label="Select row"
        checked={row.getIsSelected()}
        className="mb-2"
        onCheckedChange={value => row.toggleSelected(!!value)}
      />
    ),
    enableHiding: false,
    enableSorting: false,
    header: ({table}) => (
      <Checkbox
        aria-label="Select all"
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        className="mb-2"
        onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
      />
    ),
    id: 'select',
  },
  {
    accessorKey: 'pkgbase',
    cell: ({row}) => (
      <span className="font-medium">{row.original.pkgbase}</span>
    ),
    filterFn: 'includesString',
    header: ({column}) => (
      <DataTableColumnHeader column={column} title="Pkgbase" />
    ),
    id: 'pkgbase',
  },
  {
    cell: ({row}) => (
      <span className="font-medium">{row.original.repository}</span>
    ),
    filterFn: (row, _, filterValue) => {
      if (Array.isArray(filterValue)) {
        return filterValue.includes(row.original.repository);
      }
      return true;
    },
    header: ({column}) => (
      <DataTableColumnHeader column={column} title="Repository" />
    ),
    id: 'repository',
  },
  {
    cell: ({row}) => <span className="font-medium">{row.original.march}</span>,
    filterFn: (row, _, filterValue) => {
      if (Array.isArray(filterValue)) {
        return filterValue.includes(row.original.march);
      }
      return true;
    },
    header: ({column}) => (
      <DataTableColumnHeader column={column} title="Arch" />
    ),
    id: 'arch',
  },
  {
    cell: ({row}) => (
      <div className="w-32">
        <Badge className="text-muted-foreground px-1.5" variant="outline">
          {packageStatusToIcon(row.original.status)}
          {row.original.status}
        </Badge>
      </div>
    ),
    filterFn: (row, _, filterValue) => {
      if (Array.isArray(filterValue) && filterValue.length) {
        return filterValue.includes(row.original.status);
      }
      return true;
    },
    header: ({column}) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    id: 'status',
  },
  {
    accessorKey: 'updated',
    cell: ({row}) => {
      const date = new Date(row.original.updated);
      return (
        <span className="font-medium">
          {date.toLocaleDateString()}, {date.toLocaleTimeString()}
        </span>
      );
    },
    enableSorting: true,
    header: ({column}) => (
      <DataTableColumnHeader column={column} title="Updated At" />
    ),
    id: 'updated at',
  },
  {
    cell: ({row}) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
            size="icon"
            variant="ghost"
          >
            <Ellipsis className="size-5" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="max-w-48">
          <DropdownMenuItem variant="destructive">
            <RotateCcw /> Rebuild
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={row.original.status !== PackageStatus.FAILED}
          >
            <Link
              className="flex items-center gap-2 w-full"
              href={`/dashboard/logs/${row.original.march}/${row.original.pkgbase}`}
              prefetch={false}
            >
              <SquareTerminal /> Get Logs
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={row.original.status !== PackageStatus.FAILED}
          >
            <Link
              className="flex items-center gap-2 w-full"
              href={`/dashboard/logs/${row.original.march}/${row.original.pkgbase}?raw=true`}
              prefetch={false}
            >
              <Logs /> Get Raw Logs
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    id: 'actions',
  },
];

export default function PackageListPage() {
  const {activeServer} = useSidebar();
  const [data, setData] = useState<null | RebuildPackageList>(null);
  const [error, setError] = useState<null | string>(null);

  useEffect(() => {
    setError(null);
    listRebuildPackages()
      .then(response => {
        if ('error' in response && response.error) {
          setError(response.error);
          toast.error(`Failed to fetch package list: ${response.error}`, {
            closeButton: true,
            duration: Infinity,
          });
        } else if (Array.isArray(response)) {
          setData(response);
        }
      })
      .catch(() => {
        setError('Failed to fetch package list, please try again later.');
        toast.error('Failed to fetch package list, please try again later.', {
          closeButton: true,
          duration: Infinity,
        });
      });
  }, [activeServer]);

  const customFilters = useMemo(
    () => [
      (table: Table<RebuildPackage>) => (
        <div className="flex" key="march-filter">
          <ComboBox
            addItem={march => {
              const marchFilter = (table.getColumn('arch')?.getFilterValue() ??
                packageMArchValues) as PackageMArch[];
              if (!marchFilter.includes(march)) {
                table
                  .getColumn('arch')
                  ?.setFilterValue([...marchFilter, march]);
              }
            }}
            items={packageMArchValues}
            noSelectedItemsText="No architecture selected"
            removeItem={march => {
              const marchFilter = (table.getColumn('arch')?.getFilterValue() ??
                packageMArchValues) as PackageMArch[];
              if (marchFilter.includes(march)) {
                table
                  .getColumn('arch')
                  ?.setFilterValue(marchFilter.filter(m => m !== march));
              }
            }}
            searchNoResultsText="No architectures found"
            searchPlaceholder="Search architectures..."
            selectedItems={
              (table.getColumn('arch')?.getFilterValue() ??
                packageMArchValues) as PackageMArch[]
            }
            selectedItemsText={count =>
              count > 1 ? 'architectures selected' : 'architecture selected'
            }
          />
        </div>
      ),
      (table: Table<RebuildPackage>) => (
        <div className="flex" key="repo-filter">
          <ComboBox
            addItem={repo => {
              const repoFilter = (table
                .getColumn('repository')
                ?.getFilterValue() ?? packageRepoValues) as PackageRepo[];
              if (!repoFilter.includes(repo)) {
                table
                  .getColumn('repository')
                  ?.setFilterValue([...repoFilter, repo]);
              }
            }}
            items={packageRepoValues}
            noSelectedItemsText="No repository selected"
            removeItem={repo => {
              const repoFilter = (table
                .getColumn('repository')
                ?.getFilterValue() ?? packageRepoValues) as PackageRepo[];
              if (repoFilter.includes(repo)) {
                table
                  .getColumn('repository')
                  ?.setFilterValue(repoFilter.filter(r => r !== repo));
              }
            }}
            searchNoResultsText="No repositories found"
            searchPlaceholder="Search repositories..."
            selectedItems={
              (table.getColumn('repository')?.getFilterValue() ??
                packageRepoValues) as PackageRepo[]
            }
            selectedItemsText={count =>
              count > 1 ? 'repositories selected' : 'repository selected'
            }
          />
        </div>
      ),
      (table: Table<RebuildPackage>) => (
        <div className="flex" key="status-filter">
          <ComboBox
            addItem={status => {
              const statusFilter = (table
                .getColumn('status')
                ?.getFilterValue() ?? packageStatusValues) as PackageStatus[];
              if (!statusFilter.includes(status)) {
                table
                  .getColumn('status')
                  ?.setFilterValue([...statusFilter, status]);
              }
            }}
            items={packageStatusValues}
            noSelectedItemsText="No status selected"
            removeItem={status => {
              const statusFilter = (table
                .getColumn('status')
                ?.getFilterValue() ?? packageStatusValues) as PackageStatus[];
              if (statusFilter.includes(status)) {
                table
                  .getColumn('status')
                  ?.setFilterValue(statusFilter.filter(s => s !== status));
              }
            }}
            searchNoResultsText="No statuses found"
            searchPlaceholder="Search statuses..."
            selectedItems={
              (table.getColumn('status')?.getFilterValue() ??
                packageStatusValues) as PackageStatus[]
            }
            selectedItemsText={count =>
              count > 1 ? 'statuses selected' : 'status selected'
            }
          />
        </div>
      ),
    ],
    []
  );
  const filters = useMemo(
    () => [
      {
        icon: Search,
        id: 'pkgbase',
        placeholder: 'Search packages...',
      },
    ],
    []
  );
  const initialSortingState = useMemo(
    () => [
      {
        desc: true,
        id: 'updated at',
      },
    ],
    []
  );

  return (
    <Card className="flex h-full w-full items-center justify-center p-2">
      {data ? (
        <DataTable
          columns={columns}
          customFilters={customFilters}
          data={data}
          filters={filters}
          initialSortingState={initialSortingState}
          shrinkFirstColumn
        />
      ) : (
        <Loader animate text={error ?? 'Loading package list...'} />
      )}
    </Card>
  );
}
