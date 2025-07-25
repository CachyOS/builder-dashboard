'use client';

import {ColumnDef} from '@tanstack/react-table';
import {Ellipsis, Logs, RotateCcw, Search, SquareTerminal} from 'lucide-react';
import Link from 'next/link';
import {Fragment, useCallback, useEffect, useState} from 'react';
import {toast} from 'sonner';
import {useDebounce} from 'use-debounce';

import {listPackages, searchPackages} from '@/app/actions';
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
import {Input} from '@/components/ui/input';
import {useSidebar} from '@/components/ui/sidebar';
import {
  ListPackageResponse,
  Package,
  PackageMArch,
  packageMArchValues,
  PackageRepo,
  packageRepoValues,
  PackageStatus,
  packageStatusValues,
} from '@/lib/typings';
import {packageStatusToIcon} from '@/lib/utils';

const columns: ColumnDef<Package>[] = [
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
      <span className="font-medium">
        {row.original.pkgname} ({row.original.pkgbase})
      </span>
    ),
    header: ({column}) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    id: 'name',
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
    cell: ({row}) => (
      <span className="font-medium">{row.original.version}</span>
    ),
    header: ({column}) => (
      <DataTableColumnHeader column={column} title="Version" />
    ),
    id: 'version',
  },
  {
    cell: ({row}) => (
      <span className="font-medium">{row.original.repo_version}</span>
    ),
    header: ({column}) => (
      <DataTableColumnHeader column={column} title="Repo Version" />
    ),
    id: 'repo version',
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
    header: ({column}) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    id: 'status',
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
  const [data, setData] = useState<ListPackageResponse | null>(null);
  const [error, setError] = useState<null | string>(null);
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery] = useDebounce(searchQuery, 800);
  const [manual, setManual] = useState(true);
  const [marchFilter, setMarchFilter] = useState(packageMArchValues);
  const [repoFilter, setRepoFilter] = useState(packageRepoValues);
  const [statusFilter, setStatusFilter] = useState(packageStatusValues);

  const addMarchFilter = useCallback(
    (march: PackageMArch) => {
      if (!marchFilter.includes(march)) {
        setMarchFilter(prev => [...prev, march]);
      }
    },
    [marchFilter]
  );
  const removeMarchFilter = useCallback((march: PackageMArch) => {
    setMarchFilter(prev => prev.filter(m => m !== march));
  }, []);

  const addRepoFilter = useCallback(
    (repo: PackageRepo) => {
      if (!repoFilter.includes(repo)) {
        setRepoFilter(prev => [...prev, repo]);
      }
    },
    [repoFilter]
  );
  const removeRepoFilter = useCallback((repo: PackageRepo) => {
    setRepoFilter(prev => prev.filter(r => r !== repo));
  }, []);

  const addStatusFilter = useCallback(
    (status: PackageStatus) => {
      if (!statusFilter.includes(status)) {
        setStatusFilter(prev => [...prev, status]);
      }
    },
    [statusFilter]
  );
  const removeStatusFilter = useCallback((status: PackageStatus) => {
    setStatusFilter(prev => prev.filter(s => s !== status));
  }, []);

  useEffect(() => {
    setError(null);
    if (debouncedSearchQuery) {
      return;
    }
    listPackages({
      current_page: currentPage,
      march_filter: marchFilter,
      page_size: pageSize,
      repo_filter: repoFilter,
      status_filter: statusFilter,
    })
      .then(response => {
        if ('error' in response && response.error) {
          setError(response.error);
          toast.error(`Failed to fetch package list: ${response.error}`, {
            closeButton: true,
            duration: Infinity,
          });
        }
        if ('packages' in response) {
          setManual(true);
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
  }, [
    activeServer,
    currentPage,
    debouncedSearchQuery,
    marchFilter,
    pageSize,
    repoFilter,
    statusFilter,
  ]);

  useEffect(() => {
    setError(null);
    if (debouncedSearchQuery) {
      searchPackages({
        march_filter: marchFilter,
        repo_filter: repoFilter,
        search: debouncedSearchQuery,
        status_filter: statusFilter,
      }).then(response => {
        if ('error' in response && response.error) {
          setError(response.error);
          toast.error(`Failed to search packages: ${response.error}`, {
            closeButton: true,
            duration: Infinity,
          });
        } else if (Array.isArray(response)) {
          setManual(false);
          setData({
            packages: response,
            total_packages: response.length,
            total_pages: 1,
          });
        }
      });
    }
  }, [debouncedSearchQuery, marchFilter, repoFilter, statusFilter]);

  return (
    <Card className="flex h-full w-full items-center justify-center p-2">
      {data ? (
        <DataTable
          columns={columns}
          data={data.packages}
          manualFiltering={manual}
          manualPagination={manual}
          onPageChange={pageIndex => setCurrentPage(pageIndex + 1)}
          onPageSizeChange={pageSize => setPageSize(pageSize)}
          packageCount={manual ? data.total_packages : undefined}
          pageCount={manual ? data.total_pages : undefined}
          shrinkFirstColumn
          viewOptionsAdditionalItems={
            <Fragment>
              <Input
                className="max-w-xs w-full"
                icon={Search}
                id="package-search"
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search packages..."
                type="text"
                value={searchQuery}
              />
              <div className="flex gap-2">
                <div className="flex">
                  <ComboBox
                    addItem={addMarchFilter}
                    items={packageMArchValues}
                    noSelectedItemsText="No architecture selected"
                    removeItem={removeMarchFilter}
                    searchNoResultsText="No architectures found"
                    searchPlaceholder="Search architectures..."
                    selectedItems={marchFilter}
                    selectedItemsText={count =>
                      count > 1
                        ? 'architectures selected'
                        : 'architecture selected'
                    }
                  />
                </div>
                <div className="flex">
                  <ComboBox
                    addItem={addRepoFilter}
                    items={packageRepoValues}
                    noSelectedItemsText="No repository selected"
                    removeItem={removeRepoFilter}
                    searchNoResultsText="No repositories found"
                    searchPlaceholder="Search repositories..."
                    selectedItems={repoFilter}
                    selectedItemsText={count =>
                      count > 1
                        ? 'repositories selected'
                        : 'repository selected'
                    }
                  />
                </div>
                <div className="flex">
                  <ComboBox
                    addItem={addStatusFilter}
                    items={packageStatusValues}
                    noSelectedItemsText="No status selected"
                    removeItem={removeStatusFilter}
                    searchNoResultsText="No statuses found"
                    searchPlaceholder="Search statuses..."
                    selectedItems={statusFilter}
                    selectedItemsText={count =>
                      count > 1 ? 'statuses selected' : 'status selected'
                    }
                  />
                </div>
              </div>
            </Fragment>
          }
        />
      ) : (
        <Loader animate text={error ?? 'Loading package list...'} />
      )}
    </Card>
  );
}
