import { t } from './labels';

/**
 * Vercel rejects a request body over 4.5 MB at the edge, before the API
 * function ever runs — so there is no server message to show, only a bare
 * 413. Checking here turns a long wait and a misleading error into an
 * instant, accurate one. Four leaves room for the multipart envelope.
 */
export const MAX_UPLOAD_MB = 4;

/** The first file over the limit, as a ready-to-show message. */
export function tooLargeMessage(files: File[]): string {
  const over = files.find((f) => f.size > MAX_UPLOAD_MB * 1024 * 1024);
  if (!over) return '';
  return t.admin.upload.tooLarge((over.size / 1024 / 1024).toFixed(1), MAX_UPLOAD_MB);
}

/**
 * What to show when an upload fails. The API's own message is the useful
 * one; this used to be thrown away and replaced with "check Cloudinary",
 * which named the wrong culprit for every cause but one.
 */
export function uploadErrorMessage(e: unknown): string {
  if ((e as { status?: number })?.status === 413) return t.admin.upload.serverTooLarge;
  const message = e instanceof Error ? e.message.trim() : '';
  return message || t.admin.upload.error;
}
