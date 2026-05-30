'use client';

import {ArrowLeft} from 'lucide-react';
import Link from 'next/link';
import {useParams, useRouter} from 'next/navigation';
import {useCallback, useEffect, useMemo, useState} from 'react';
import {toast} from 'sonner';

import {
  cancelSubmission,
  getPackageSubmissions,
  queueSubmission,
} from '@/app/actions/custom';
import {ReviewNoteDialog} from '@/components/custom/review-note-dialog';
import Loader from '@/components/loader';
import {Card, CardContent} from '@/components/ui/card';
import {useSidebar} from '@/components/ui/sidebar';
import {
  isActionError,
  type PackageSubmission,
  SubmissionStatus,
  UserScope,
} from '@/lib/typings';
import {checkScopes} from '@/lib/utils';

import {SubmissionDetailHeader} from './_header';
import {SubmissionHistoryCard} from './_history-card';
import {SubmissionLogsCard} from './_logs-card';
import {SubmissionReviewNoteCard} from './_review-note-card';
import {SubmissionSourceCard} from './_source-card';
import {SubmissionTimelineCard} from './_timeline-card';

export default function SubmissionDetailPage() {
  const params = useParams<{id: string}>();
  const router = useRouter();
  const id = params?.id;
  const {scopes} = useSidebar();
  const isAdmin = useMemo(
    () => checkScopes(scopes, [UserScope.ADMIN]),
    [scopes]
  );

  const [all, setAll] = useState<PackageSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteAction, setNoteAction] = useState<'approve' | 'reject' | null>(
    null
  );
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(() => {
    setLoading(true);
    getPackageSubmissions()
      .then(d => {
        if (!isActionError(d) && 'submissions' in d) setAll(d.submissions);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const submission = useMemo(() => all.find(s => s.id === id), [all, id]);
  const history = useMemo(() => {
    if (!submission) return [];
    return all
      .filter(s => s.pkgbase === submission.pkgbase && s.id !== submission.id)
      .sort((a, b) => b.updated - a.updated)
      .slice(0, 10);
  }, [all, submission]);

  const handleQueue = useCallback(async () => {
    if (!submission) return;
    setBusy(true);
    const t = toast.loading('Queueing build…');
    try {
      const r = await queueSubmission(submission.id);
      if (isActionError(r)) {
        toast.error(r.error, {id: t});
      } else {
        toast.success('Build queued.', {id: t});
        refresh();
      }
    } finally {
      setBusy(false);
    }
  }, [submission, refresh]);

  const handleCancel = useCallback(async () => {
    if (!submission) return;
    setBusy(true);
    const t = toast.loading('Cancelling…');
    try {
      const r = await cancelSubmission(submission.id);
      if (isActionError(r)) {
        toast.error(r.error, {id: t});
      } else {
        toast.success('Cancelled.', {id: t});
        refresh();
      }
    } finally {
      setBusy(false);
    }
  }, [submission, refresh]);

  if (loading) return <Loader animate text="Loading submission…" />;

  if (!submission) {
    return (
      <div className="flex flex-col gap-4">
        <Link
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          href="/dashboard/custom/submissions"
        >
          <ArrowLeft className="size-3.5" />
          Back to submissions
        </Link>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Submission not found.
          </CardContent>
        </Card>
      </div>
    );
  }

  const showLogs =
    submission.submission_status === SubmissionStatus.BUILD_FAILED;

  return (
    <div className="flex flex-col gap-6">
      <SubmissionDetailHeader
        busy={busy}
        isAdmin={isAdmin}
        onApprove={() => setNoteAction('approve')}
        onCancel={handleCancel}
        onQueue={handleQueue}
        onReject={() => setNoteAction('reject')}
        submission={submission}
      />

      <div className="grid gap-6 md:grid-cols-3">
        <div className="flex flex-col gap-6 md:col-span-2">
          <SubmissionTimelineCard submission={submission} />
          {showLogs && <SubmissionLogsCard submission={submission} />}
          <SubmissionSourceCard submission={submission} />
        </div>

        <div className="flex flex-col gap-6">
          <SubmissionReviewNoteCard note={submission.review_note} />
          <SubmissionHistoryCard
            history={history}
            pkgbase={submission.pkgbase}
          />
        </div>
      </div>

      {noteAction && (
        <ReviewNoteDialog
          action={noteAction}
          onOpenChange={open => !open && setNoteAction(null)}
          onSuccess={() => {
            setNoteAction(null);
            refresh();
            router.refresh();
          }}
          open={!!noteAction}
          submissionId={submission.id}
        />
      )}
    </div>
  );
}
