'use client';

import {Package as PackageIcon, Search, UserPlus} from 'lucide-react';
import {useCallback, useEffect, useMemo, useState} from 'react';

import {getCustomPackages, getCustomRepos} from '@/app/actions/custom';
import {getLoggedInUser} from '@/app/actions/session';
import {AddMaintainerDialog} from '@/components/custom/add-maintainer-dialog';
import Loader from '@/components/loader';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {EmptyState} from '@/components/ui/empty-state';
import {FilterToolbar} from '@/components/ui/filter-toolbar';
import {Input} from '@/components/ui/input';
import {MetadataRow} from '@/components/ui/metadata-row';
import {PageHeader} from '@/components/ui/page-header';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {useSidebar} from '@/components/ui/sidebar';
import {StatusDot, type StatusTone} from '@/components/ui/status-dot';
import {type CustomPackage, type CustomRepo, UserScope} from '@/lib/typings';
import {checkScopes} from '@/lib/utils';

const statusTone: Record<string, StatusTone> = {
  BUILDING: 'building',
  DONE: 'success',
  FAILED: 'danger',
  QUEUED: 'warning',
  SKIPPED: 'muted',
};

const statusVariant: Record<
  string,
  'building' | 'danger' | 'muted' | 'success' | 'warning'
> = {
  BUILDING: 'building',
  DONE: 'success',
  FAILED: 'danger',
  QUEUED: 'warning',
  SKIPPED: 'muted',
};

export default function PackagesListPage() {
  const {scopes} = useSidebar();
  const isAdmin = useMemo(
    () => checkScopes(scopes, [UserScope.ADMIN]),
    [scopes]
  );

  const [packages, setPackages] = useState<CustomPackage[]>([]);
  const [repos, setRepos] = useState<CustomRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [archFilter, setArchFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<CustomPackage | null>(null);
  const [currentUser, setCurrentUser] = useState('');

  const refresh = useCallback(() => {
    setLoading(true);
    Promise.all([getCustomPackages(), getCustomRepos()])
      .then(([pkgs, rs]) => {
        if (!('error' in pkgs)) setPackages(pkgs.custom_packages);
        if (!('error' in rs)) setRepos(rs.repos);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
    getLoggedInUser(false).then(u => {
      if (!('error' in u)) setCurrentUser(u.username);
    });
  }, [refresh]);

  const archOptions = useMemo(() => {
    const s = new Set<string>();
    for (const p of packages) s.add(p.march);
    return Array.from(s).sort();
  }, [packages]);

  const statusOptions = useMemo(() => {
    const s = new Set<string>();
    for (const p of packages) s.add(p.status);
    return Array.from(s).sort();
  }, [packages]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return packages.filter(p => {
      if (archFilter !== 'ALL' && p.march !== archFilter) return false;
      if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
      if (q) {
        const hay = `${p.pkgbase} ${p.pkgname}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [packages, search, archFilter, statusFilter]);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        description="Custom packages currently tracked by the build system."
        title="Packages"
      />

      <FilterToolbar>
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-8 pl-8"
            onChange={e => setSearch(e.target.value)}
            placeholder="Search packages…"
            value={search}
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Select onValueChange={setStatusFilter} value={statusFilter}>
            <SelectTrigger className="h-8 w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              {statusOptions.map(s => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select onValueChange={setArchFilter} value={archFilter}>
            <SelectTrigger className="h-8 w-[140px]">
              <SelectValue placeholder="Architecture" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All architectures</SelectItem>
              {archOptions.map(a => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </FilterToolbar>

      {loading ? (
        <Loader animate text="Loading packages…" />
      ) : filtered.length === 0 ? (
        <EmptyState
          description={
            packages.length === 0
              ? 'No custom packages have been built yet.'
              : 'No packages match the current filters.'
          }
          icon={<PackageIcon />}
          title={packages.length === 0 ? 'No packages' : 'No matches'}
        />
      ) : (
        <ul className="flex flex-col divide-y rounded-lg border">
          {filtered.map(pkg => {
            const tone = statusTone[pkg.status] ?? 'muted';
            const variant = statusVariant[pkg.status] ?? 'muted';
            return (
              <li
                className="group flex items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/50"
                key={`${pkg.repository}-${pkg.march}-${pkg.pkgname}`}
              >
                <StatusDot pulse={pkg.status === 'BUILDING'} tone={tone} />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-sm font-medium">
                    {pkg.pkgbase}
                  </span>
                  <MetadataRow
                    items={[
                      {value: pkg.pkgname},
                      {value: pkg.repository},
                      {value: pkg.march},
                      {label: 'v', mono: true, value: pkg.version},
                      {
                        value: new Date(pkg.updated * 1000).toLocaleString(),
                      },
                    ]}
                  />
                </div>
                <Badge variant={variant}>{pkg.status}</Badge>
                {isAdmin && (
                  <Button
                    className="opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() => {
                      setSelected(pkg);
                      setDialogOpen(true);
                    }}
                    size="xs"
                    variant="outline"
                  >
                    <UserPlus className="size-3.5" />
                    Maintainer
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <AddMaintainerDialog
        currentUser={currentUser}
        onOpenChange={open => {
          setDialogOpen(open);
          if (!open) setSelected(null);
        }}
        onSuccess={refresh}
        open={dialogOpen}
        packages={selected ? [selected] : packages}
        repos={repos}
      />
    </div>
  );
}
