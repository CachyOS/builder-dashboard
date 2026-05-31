import type {StatusTone} from '@/components/ui/status-dot';

import {SubmissionStatus} from '@/lib/typings';

export const submissionStatusTone: Record<string, StatusTone> = {
  [SubmissionStatus.APPROVED]: 'info',
  [SubmissionStatus.BUILD_DONE]: 'success',
  [SubmissionStatus.BUILD_FAILED]: 'danger',
  [SubmissionStatus.BUILD_QUEUED]: 'building',
  [SubmissionStatus.CANCELLED]: 'muted',
  [SubmissionStatus.PENDING_REVIEW]: 'warning',
  [SubmissionStatus.REJECTED]: 'danger',
};

export const submissionStatusPulse: Record<string, boolean> = {
  [SubmissionStatus.BUILD_QUEUED]: true,
  [SubmissionStatus.PENDING_REVIEW]: true,
};

export function labelFor(status: string): string {
  return status
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/^./, c => c.toUpperCase())
    .replace(/build /, 'Build ');
}

export function pulseFor(status: string): boolean {
  return submissionStatusPulse[status] ?? false;
}

export function toneFor(status: string): StatusTone {
  return submissionStatusTone[status] ?? 'muted';
}
