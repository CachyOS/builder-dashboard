'use client';

import {IconRefresh} from '@tabler/icons-react';
import {ColumnDef, Table} from '@tanstack/react-table';
import {ChevronDown, Search} from 'lucide-react';
import {useEffect, useMemo, useState} from 'react';
import {toast} from 'sonner';

import {getAuditLogs} from '@/app/actions';
import Loader from '@/components/loader';
import {Badge} from '@/components/ui/badge';
import {Card} from '@/components/ui/card';
import {ComboBox} from '@/components/ui/combobox';
import {DataTable} from '@/components/ui/data-table';
import {DataTableColumnHeader} from '@/components/ui/data-table-column-header';
import {useSidebar} from '@/components/ui/sidebar';
import {ParsedAuditLogEntryWithPackages} from '@/lib/typings';

const columns: ColumnDef<ParsedAuditLogEntryWithPackages>[] = [
  {
    cell: ({row}) => {
      return row.getCanExpand() ? (
        <button
          className="cursor-pointer"
          onClick={row.getToggleExpandedHandler()}
        >
          {row.getIsExpanded() ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4 rotate-270" />
          )}
        </button>
      ) : (
        ''
      );
    },
    id: 'expander',
  },
  {
    cell: ({row}) => <span className="font-medium">{row.original.id}</span>,
    header: ({column}) => <DataTableColumnHeader column={column} title="ID" />,
    id: 'ID',
  },
  {
    accessorKey: 'description',
    cell: ({row}) => (
      <button
        className="cursor-pointer"
        onClick={row.getToggleExpandedHandler()}
      >
        <span className={row.depth === 1 ? 'font-medium ml-8' : 'font-medium'}>
          {row.original.description}
        </span>
      </button>
    ),
    header: ({column}) => (
      <DataTableColumnHeader column={column} title="Description" />
    ),
    id: 'description',
  },
  {
    accessorKey: 'eventName',
    cell: ({row}) =>
      row.depth === 0 && (
        <Badge className="text-muted-foreground px-1.5" variant="outline">
          <IconRefresh className="stroke-green-500 size-5" />
          {row.original.eventName}
        </Badge>
      ),
    header: ({column}) => (
      <DataTableColumnHeader column={column} title="Event" />
    ),
    id: 'event',
  },
  {
    accessorKey: 'username',
    cell: ({row}) => (
      <span className="font-medium">{row.original.username}</span>
    ),
    filterFn: (row, _, filterValue) => {
      if (Array.isArray(filterValue)) {
        return filterValue.includes(row.original.username);
      }
      return true;
    },
    header: ({column}) => (
      <DataTableColumnHeader column={column} title="Username" />
    ),
    id: 'username',
  },
  {
    cell: ({row}) => {
      const date = new Date(row.original.updated);
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

export default function AuditLogsPage() {
  const {activeServer} = useSidebar();
  const [data, setData] = useState<null | ParsedAuditLogEntryWithPackages[]>(
    null
  );
  const [users, setUsers] = useState<string[]>([]);
  const [error, setError] = useState<null | string>(null);

  useEffect(() => {
    setError(null);
    setData(null);
    getAuditLogs()
      .then(response => {
        if ('error' in response && response.error) {
          setError(response.error);
          toast.error(`Failed to fetch repo actions: ${response.error}`, {
            closeButton: true,
            duration: Infinity,
          });
        }
        if (Array.isArray(response)) {
          setData(response);
          setUsers(Array.from(new Set(response.map(entry => entry.username))));
        }
      })
      .catch(() => {
        setError('Failed to fetch repo actions, please try again later.');
        toast.error('Failed to fetch repo actions, please try again later.', {
          closeButton: true,
          duration: Infinity,
        });
      });
  }, [activeServer]);

  const filters = useMemo(
    () => [
      {
        icon: Search,
        id: 'description',
        placeholder: 'Search description...',
      },
    ],
    []
  );

  const customFilters = useMemo(
    () =>
      users.length
        ? [
            (table: Table<ParsedAuditLogEntryWithPackages>) => (
              <div className="flex" key="username-filter">
                <ComboBox
                  addItem={user => {
                    const userFilter = (table
                      .getColumn('username')
                      ?.getFilterValue() ?? users) as string[];
                    if (!userFilter.includes(user)) {
                      table
                        .getColumn('username')
                        ?.setFilterValue([...userFilter, user]);
                    }
                  }}
                  items={users}
                  noSelectedItemsText="No user selected"
                  removeItem={user => {
                    const userFilter = (table
                      .getColumn('username')
                      ?.getFilterValue() ?? users) as string[];
                    if (userFilter.includes(user)) {
                      table
                        .getColumn('username')
                        ?.setFilterValue(userFilter.filter(u => u !== user));
                    }
                  }}
                  searchNoResultsText="No users found"
                  searchPlaceholder="Search users..."
                  selectedItems={
                    (table.getColumn('username')?.getFilterValue() ??
                      users) as string[]
                  }
                  selectedItemsText={count =>
                    count > 1 ? 'users selected' : 'user selected'
                  }
                />
              </div>
            ),
          ]
        : [],
    [users]
  );

  return (
    <Card className="flex h-full w-full items-center justify-center p-2">
      {data ? (
        <DataTable
          columns={columns}
          customFilters={customFilters}
          data={data}
          filters={filters}
          getSubRows={row => row.packages as ParsedAuditLogEntryWithPackages[]}
          shrinkFirstColumn
        />
      ) : (
        <Loader animate text={error ?? 'Loading audit logs...'} />
      )}
    </Card>
  );
}
