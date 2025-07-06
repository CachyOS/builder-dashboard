'use client';

import {ColumnDef} from '@tanstack/react-table';
import {Ellipsis} from 'lucide-react';
import {useEffect, useState} from 'react';
import {toast} from 'sonner';

import {listPackages} from '@/app/actions';
import Loader from '@/components/loader';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Card} from '@/components/ui/card';
import {Checkbox} from '@/components/ui/checkbox';
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
import {ListPackageResponse, Package} from '@/lib/typings';
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
    cell: () => (
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
        <DropdownMenuContent align="end" className="w-32">
          <DropdownMenuItem>Edit</DropdownMenuItem>
          <DropdownMenuItem>Make a copy</DropdownMenuItem>
          <DropdownMenuItem>Favorite</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
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
  useEffect(() => {
    setError(null);
    listPackages({
      current_page: currentPage,
      page_size: pageSize,
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
  }, [activeServer, currentPage, pageSize]);
  return (
    <Card className="flex h-full w-full items-center justify-center p-2">
      {data ? (
        <DataTable
          columns={columns}
          data={data.packages}
          manualFiltering
          manualPagination
          onPageChange={pageIndex => setCurrentPage(pageIndex + 1)}
          onPageSizeChange={pageSize => setPageSize(pageSize)}
          packageCount={data.total_packages}
          pageCount={data.total_pages}
          shrinkFirstColumn
        />
      ) : (
        <Loader animate text={error ?? 'Loading package list...'} />
      )}
    </Card>
  );
}
