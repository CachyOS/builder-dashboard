'use client';

import {ColumnDef} from '@tanstack/react-table';
import {useCallback, useEffect, useState} from 'react';
import {toast} from 'sonner';

import {listRepoActions} from '@/app/actions';
import Loader from '@/components/loader';
import {Badge} from '@/components/ui/badge';
import {Card} from '@/components/ui/card';
import {Checkbox} from '@/components/ui/checkbox';
import {ComboBox} from '@/components/ui/combobox';
import {DataTable} from '@/components/ui/data-table';
import {DataTableColumnHeader} from '@/components/ui/data-table-column-header';
import {useSidebar} from '@/components/ui/sidebar';
import {
  PackageMArch,
  packageMArchValues,
  PackageRepo,
  packageRepoValues,
  RepoAction,
  RepoActionsResponse,
} from '@/lib/typings';

const columns: ColumnDef<RepoAction>[] = [
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
    cell: ({row}) => (
      <span className="font-medium">{row.original.packages}</span>
    ),
    header: ({column}) => (
      <DataTableColumnHeader column={column} title="Packages" />
    ),
    id: 'packages',
  },
  {
    cell: ({row}) => (
      <span className="font-medium">{row.original.action_type}</span>
    ),
    header: ({column}) => (
      <DataTableColumnHeader column={column} title="Action" />
    ),
    id: 'action',
  },
  {
    cell: ({row}) => (
      <Badge
        className="text-muted-foreground px-1.5"
        variant={row.original.status ? 'default' : 'destructive'}
      >
        {row.original.status ? 'Success' : 'Failed'}
      </Badge>
    ),
    header: ({column}) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    id: 'status',
  },
  {
    cell: ({row}) => (
      <span className="font-medium">{row.original.repository}</span>
    ),
    header: ({column}) => (
      <DataTableColumnHeader column={column} title="Repository" />
    ),
    id: 'repository',
  },
  {
    cell: ({row}) => <span className="font-medium">{row.original.march}</span>,
    header: ({column}) => (
      <DataTableColumnHeader column={column} title="Arch" />
    ),
    id: 'arch',
  },
  {
    cell: ({row}) => {
      const date = new Date(row.original.updated * 1000);
      return (
        <span className="font-medium">
          {date.toLocaleDateString()}, {date.toLocaleTimeString()}
        </span>
      );
    },
    header: ({column}) => (
      <DataTableColumnHeader column={column} title="Updated At" />
    ),
    id: 'updated at',
  },
];

export default function RepoActionsPage() {
  const {activeServer} = useSidebar();
  const [data, setData] = useState<null | RepoActionsResponse>(null);
  const [error, setError] = useState<null | string>(null);
  const [pageSize, setPageSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [marchFilter, setMarchFilter] = useState<PackageMArch | undefined>();
  const [repoFilter, setRepoFilter] = useState<PackageRepo | undefined>();

  const handleMarchFilterChange = useCallback((march: PackageMArch) => {
    setMarchFilter(march);
  }, []);

  const handleRepoFilterChange = useCallback((repo: PackageRepo) => {
    setRepoFilter(repo);
  }, []);

  useEffect(() => {
    setError(null);
    listRepoActions({
      current_page: currentPage,
      march: marchFilter,
      page_size: pageSize,
      repo: repoFilter,
    })
      .then(response => {
        if ('error' in response && response.error) {
          setError(response.error);
          toast.error(`Failed to fetch repo actions: ${response.error}`, {
            closeButton: true,
            duration: Infinity,
          });
        }
        if ('actions' in response) {
          setData(response);
        }
      })
      .catch(() => {
        setError('Failed to fetch repo actions, please try again later.');
        toast.error('Failed to fetch repo actions, please try again later.', {
          closeButton: true,
          duration: Infinity,
        });
      });
  }, [activeServer, currentPage, pageSize, marchFilter, repoFilter]);

  return (
    <Card className="flex h-full w-full items-center justify-center p-2">
      {data ? (
        <DataTable
          columns={columns}
          data={data.actions}
          manualFiltering
          manualPagination
          onPageChange={pageIndex => setCurrentPage(pageIndex + 1)}
          onPageSizeChange={pageSize => setPageSize(pageSize)}
          pageCount={data.total_pages}
          shrinkFirstColumn
          viewOptionsAdditionalItems={
            <div className="flex gap-2">
              <div className="flex">
                <ComboBox
                  items={packageMArchValues}
                  noSelectedItemsText="No architecture selected"
                  onValueChange={handleMarchFilterChange}
                  searchNoResultsText="No architectures found"
                  searchPlaceholder="Search architectures..."
                  selectedItems={[marchFilter]}
                  selectedItemsText="architecture selected"
                />
              </div>
              <div className="flex">
                <ComboBox
                  items={packageRepoValues}
                  noSelectedItemsText="No repository selected"
                  onValueChange={handleRepoFilterChange}
                  searchNoResultsText="No repositories found"
                  searchPlaceholder="Search repositories..."
                  selectedItems={[repoFilter]}
                  selectedItemsText="repository selected"
                />
              </div>
            </div>
          }
        />
      ) : (
        <Loader animate text={error ?? 'Loading repo actions...'} />
      )}
    </Card>
  );
}
