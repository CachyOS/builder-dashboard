'use client';

import {FileCheck, Plus} from 'lucide-react';
import {useCallback, useEffect, useMemo, useState} from 'react';
import {toast} from 'sonner';

import {
  approveSubmission,
  cancelSubmission,
  getCustomRepos,
  getPackageSubmissions,
  queueSubmission,
  rejectSubmission,
} from '@/app/actions/custom';
import {SubmitPackageDialog} from '@/components/custom/submit-package-dialog';
import Loader from '@/components/loader';
import {Button} from '@/components/ui/button';
import {Checkbox} from '@/components/ui/checkbox';
import {EmptyState} from '@/components/ui/empty-state';
import {PageHeader} from '@/components/ui/page-header';
import {useSidebar} from '@/components/ui/sidebar';
import {type SavedView, useSavedViews} from '@/lib/saved-views';
import {
  type CustomRepo,
  isActionError,
  type PackageSubmission,
  UserScope,
} from '@/lib/typings';
import {checkScopes} from '@/lib/utils';

import {BulkActionDialog} from './_bulk-dialog';
import {SubmissionFilterBar} from './_filter-bar';
import {SubmissionRow} from './_row';
import {SubmissionSelectionBar} from './_selection-bar';
import {
  actionLabel,
  BUILTIN_VIEWS,
  type BulkAction,
  DEFAULT_FILTERS,
  type SubmissionFilters,
} from './_types';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export default function SubmissionsListPage() {
  const {scopes} = useSidebar();
  const isAdmin = useMemo(
    () => checkScopes(scopes, [UserScope.ADMIN]),
    [scopes]
  );
  const canSubmit = useMemo(
    () =>
      checkScopes(scopes, [UserScope.PACKAGER]) ||
      checkScopes(scopes, [UserScope.ADMIN]),
    [scopes]
  );

  const [submissions, setSubmissions] = useState<PackageSubmission[]>([]);
  const [repos, setRepos] = useState<CustomRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<SubmissionFilters>(DEFAULT_FILTERS);
  const [activeViewId, setActiveViewId] = useState<null | string>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [now] = useState(() => Date.now());
  const [submitOpen, setSubmitOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<BulkAction | null>(null);
  const [bulkIds, setBulkIds] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  const {remove, save, views} = useSavedViews<SubmissionFilters>(
    'custom.submissions.savedViews',
    BUILTIN_VIEWS
  );

  const refresh = useCallback(() => {
    setLoading(true);
    Promise.all([getPackageSubmissions(), getCustomRepos()])
      .then(([subs, rs]) => {
        if (!isActionError(subs) && 'submissions' in subs) {
          setSubmissions(subs.submissions);
        }
        if (!('error' in rs)) setRepos(rs.repos);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const archOptions = useMemo(() => {
    const s = new Set<string>();
    for (const x of submissions) s.add(x.march);
    return Array.from(s).sort();
  }, [submissions]);

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    const cutoff = now - ONE_DAY_MS;
    return submissions.filter(s => {
      if (filters.status !== 'ALL' && s.submission_status !== filters.status)
        return false;
      if (filters.repo !== 'ALL' && s.repo_name !== filters.repo) return false;
      if (filters.arch !== 'ALL' && s.march !== filters.arch) return false;
      if (filters.recentOnly && s.updated * 1000 < cutoff) return false;
      if (q) {
        const hay =
          `${s.pkgbase} ${s.git_repo_url} ${s.submitter}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [submissions, filters, now]);

  const allChecked =
    filtered.length > 0 && filtered.every(f => selected.has(f.id));
  const someChecked = selected.size > 0;

  const clearSelection = useCallback(() => setSelected(new Set()), []);

  const toggleAll = useCallback(() => {
    setSelected(prev => {
      if (filtered.every(f => prev.has(f.id))) return new Set();
      return new Set(filtered.map(f => f.id));
    });
  }, [filtered]);

  const toggleOne = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSelectView = useCallback(
    (view: SavedView<SubmissionFilters>) => {
      setFilters(view.filters);
      setActiveViewId(view.id);
      clearSelection();
    },
    [clearSelection]
  );

  const handleSaveView = useCallback(
    (name: string) => {
      const next = save(name, filters);
      setActiveViewId(next.id);
    },
    [save, filters]
  );

  const handleFilterChange = useCallback(
    <K extends keyof SubmissionFilters>(
      key: K,
      value: SubmissionFilters[K]
    ) => {
      setFilters(prev => ({...prev, [key]: value}));
      setActiveViewId(null);
    },
    []
  );

  const openBulk = useCallback(
    (action: BulkAction) => {
      setBulkIds(Array.from(selected));
      setBulkAction(action);
    },
    [selected]
  );

  const runBulk = useCallback(
    async (note: string) => {
      if (!bulkAction) return;
      setBulkLoading(true);
      const trimmed = note.trim() || undefined;
      const toastId = toast.loading(
        `${actionLabel(bulkAction)} ${bulkIds.length} submission(s)…`
      );
      try {
        const results = await Promise.all(
          bulkIds.map(id => {
            switch (bulkAction) {
              case 'approve':
                return approveSubmission(id, trimmed);
              case 'cancel':
                return cancelSubmission(id);
              case 'queue':
                return queueSubmission(id);
              case 'reject':
                return rejectSubmission(id, trimmed);
            }
          })
        );
        const failed = results.filter(isActionError).length;
        if (failed > 0) {
          toast.error(`${failed} of ${results.length} action(s) failed`, {
            id: toastId,
          });
        } else {
          toast.success(
            `${actionLabel(bulkAction)} ${results.length} submission(s).`,
            {id: toastId}
          );
        }
        setBulkAction(null);
        clearSelection();
        refresh();
      } catch {
        toast.error('An unexpected error occurred.', {id: toastId});
      } finally {
        setBulkLoading(false);
      }
    },
    [bulkAction, bulkIds, clearSelection, refresh]
  );

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        actions={
          canSubmit && (
            <Button
              onClick={() => setSubmitOpen(true)}
              size="sm"
              variant="brand"
            >
              <Plus className="size-3.5" />
              Submit package
            </Button>
          )
        }
        description="Custom package submissions awaiting review or build."
        title="Submissions"
      />

      {someChecked ? (
        <SubmissionSelectionBar
          count={selected.size}
          isAdmin={isAdmin}
          onAction={openBulk}
          onClear={clearSelection}
        />
      ) : (
        <SubmissionFilterBar
          activeViewId={activeViewId}
          archOptions={archOptions}
          filters={filters}
          onDeleteView={remove}
          onFilterChange={handleFilterChange}
          onSaveView={handleSaveView}
          onSelectView={handleSelectView}
          repos={repos}
          views={views}
        />
      )}

      {loading ? (
        <Loader animate text="Loading submissions…" />
      ) : filtered.length === 0 ? (
        <EmptyState
          action={
            canSubmit && (
              <Button
                onClick={() => setSubmitOpen(true)}
                size="sm"
                variant="brand"
              >
                <Plus className="size-3.5" />
                Submit package
              </Button>
            )
          }
          description={
            submissions.length === 0
              ? 'Nothing has been submitted yet.'
              : 'No submissions match the current filters.'
          }
          icon={<FileCheck />}
          title={submissions.length === 0 ? 'No submissions' : 'No matches'}
        />
      ) : (
        <ul className="flex flex-col divide-y rounded-lg border">
          <li className="flex items-center gap-3 bg-muted/30 px-4 py-2 text-xs font-medium text-muted-foreground">
            <Checkbox
              aria-label="Select all"
              checked={
                allChecked ? true : someChecked ? 'indeterminate' : false
              }
              onCheckedChange={toggleAll}
            />
            <span>
              {filtered.length} submission{filtered.length === 1 ? '' : 's'}
            </span>
          </li>
          {filtered.map(sub => (
            <SubmissionRow
              key={sub.id}
              onToggle={toggleOne}
              selected={selected.has(sub.id)}
              submission={sub}
            />
          ))}
        </ul>
      )}

      <SubmitPackageDialog
        onOpenChange={setSubmitOpen}
        onSuccess={refresh}
        open={submitOpen}
        repos={repos}
      />

      <BulkActionDialog
        action={bulkAction}
        count={bulkIds.length}
        loading={bulkLoading}
        onConfirm={runBulk}
        onOpenChange={open => !open && setBulkAction(null)}
      />
    </div>
  );
}
