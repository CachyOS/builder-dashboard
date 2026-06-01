'use client';

import {toast} from 'sonner';

import {type ActionError, isActionError} from '@/lib/typings';

interface RunActionOptions<T> {
  errorFallback?: string;
  onSuccess?: (result: T) => void;
  successMessage?: ((result: T) => string) | string;
}

export async function runAction<T>(
  loadingMessage: string,
  fn: () => Promise<ActionError | T>,
  opts: RunActionOptions<T> = {}
): Promise<ActionError | T> {
  const toastId = toast.loading(loadingMessage);
  try {
    const result = await fn();
    if (isActionError(result)) {
      toast.error(result.error, {
        closeButton: true,
        duration: Infinity,
        id: toastId,
      });
      return result;
    }
    const successMessage =
      typeof opts.successMessage === 'function'
        ? opts.successMessage(result)
        : opts.successMessage;
    if (successMessage) {
      toast.success(successMessage, {duration: 5000, id: toastId});
    } else {
      toast.dismiss(toastId);
    }
    opts.onSuccess?.(result);
    return result;
  } catch (error) {
    const message =
      opts.errorFallback ??
      (error instanceof Error
        ? error.message
        : 'An unexpected error occurred.');
    toast.error(message, {
      closeButton: true,
      duration: Infinity,
      id: toastId,
    });
    return {error: message};
  }
}
