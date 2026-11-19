import { useId, useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';

import { ApiError } from '@/lib/api-client';
import { previewImageUrl } from '@/utils/cloudinary-image';

import {
  acceptedMediaTypes,
  deleteMedia,
  maxMediaBytes,
  uploadMedia,
  type MediaFolderName,
} from '../api';
import { AdminButton } from './AdminUI';

type MediaUploadFieldProps = {
  /** Base id for the label, file input and status region. */
  id: string;
  label: string;
  folder: MediaFolderName;
  /** Current Cloudinary public ID, or an empty string when unset. */
  publicId: string;
  /** Known delivery URL for the current asset, when available. */
  previewUrl?: string | null;
  alt?: string;
  hint?: string;
  error?: string;
  onChange: (value: { publicId: string; url: string } | null) => void;
};

const acceptAttribute = acceptedMediaTypes.join(',');

function validateFile(file: File): string | null {
  const type = file.type.toLowerCase();
  if (!(acceptedMediaTypes as readonly string[]).includes(type)) {
    return 'Choose a JPEG, PNG or WebP image. GIF and SVG files are not accepted.';
  }
  if (file.size > maxMediaBytes) {
    return 'Images must be 5 MB or smaller.';
  }
  return null;
}

/**
 * Authenticated image uploader for admin editors. Files are validated locally
 * for type and size, then streamed to the API, which re-validates the bytes and
 * owns the Cloudinary credentials. Only the public ID and delivery URL ever
 * reach the form it is embedded in.
 */
export function MediaUploadField({
  id,
  label,
  folder,
  publicId,
  previewUrl,
  alt,
  hint,
  error,
  onChange,
}: MediaUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const statusId = useId();
  const [progress, setProgress] = useState<number | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [currentUrl, setCurrentUrl] = useState<string | null>(previewUrl ?? null);

  const uploading = progress !== null;
  const message = localError ?? error ?? null;

  async function handleFile(file: File | undefined) {
    if (!file) return;

    const invalid = validateFile(file);
    if (invalid) {
      setLocalError(invalid);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    setLocalError(null);
    setProgress(0);
    setConfirmingDelete(false);

    try {
      const asset = await uploadMedia(file, {
        folder,
        alt,
        onProgress: (percent) => setProgress(percent),
      });
      setCurrentUrl(asset.url);
      onChange({ publicId: asset.publicId, url: asset.url });
    } catch (caught) {
      setLocalError(
        caught instanceof ApiError
          ? caught.message
          : 'The image could not be uploaded. Please try again.',
      );
    } finally {
      setProgress(null);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setLocalError(null);

    try {
      await deleteMedia(publicId);
      setCurrentUrl(null);
      setConfirmingDelete(false);
      onChange(null);
    } catch (caught) {
      setLocalError(
        caught instanceof ApiError
          ? caught.message
          : 'The image could not be deleted. You can still clear the reference.',
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[0.6875rem] font-medium tracking-[0.14em] text-brand-indigo uppercase">
          {label}
        </p>
        {publicId ? (
          <span className="font-mono text-[0.625rem] text-brand-muted">Cloudinary asset</span>
        ) : null}
      </div>

      <details className="border border-brand-line bg-brand-ivory/50 px-3 py-2">
        <summary className="cursor-pointer text-xs text-brand-muted">
          Use an existing Cloudinary public ID
        </summary>
        <div className="pt-3">
          <label
            htmlFor={`${id}-manual`}
            className="text-[0.625rem] font-medium tracking-[0.14em] text-brand-indigo uppercase"
          >
            Cloudinary public ID
          </label>
          <input
            id={`${id}-manual`}
            value={publicId}
            placeholder="blue-miror/gallery/example"
            onChange={(event) => {
              setLocalError(null);
              setCurrentUrl(null);
              onChange(
                event.target.value.trim() ? { publicId: event.target.value.trim(), url: '' } : null,
              );
            }}
            className="mt-2 w-full border border-brand-line bg-white px-3 py-2 font-mono text-xs text-brand-indigo"
          />
          <p className="mt-1 text-[0.625rem] leading-5 text-brand-muted">
            For assets that already exist in the Blue Miror media library.
          </p>
        </div>
      </details>

      <div className="flex flex-col gap-3 border border-brand-line bg-white/60 p-3 sm:flex-row sm:items-start">
        <div className="grid size-24 shrink-0 place-items-center overflow-hidden border border-brand-line bg-brand-ivory/70">
          {currentUrl ? (
            <img
              src={previewImageUrl(currentUrl, 320) ?? currentUrl}
              alt={alt?.trim() ? alt : 'Selected image preview'}
              loading="lazy"
              decoding="async"
              className="size-full object-cover"
            />
          ) : publicId ? (
            <span className="px-2 text-center text-[0.625rem] leading-4 text-brand-muted">
              Asset stored
            </span>
          ) : (
            <ImagePlus aria-hidden="true" size={20} className="text-brand-muted" />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          {publicId ? (
            <p className="truncate font-mono text-[0.6875rem] text-brand-muted" title={publicId}>
              {publicId}
            </p>
          ) : (
            <p className="text-xs leading-5 text-brand-muted">JPEG, PNG or WebP · 5 MB maximum.</p>
          )}

          <div className="flex flex-wrap gap-2">
            <label
              htmlFor={`${id}-file`}
              className={`inline-flex cursor-pointer items-center gap-2 border border-brand-indigo px-3 py-1.5 text-[0.625rem] font-medium tracking-[0.14em] text-brand-indigo uppercase transition-colors hover:bg-brand-indigo hover:text-brand-ivory ${
                uploading ? 'pointer-events-none opacity-60' : ''
              }`}
            >
              {uploading ? (
                <Loader2 aria-hidden="true" size={13} className="animate-spin" />
              ) : (
                <ImagePlus aria-hidden="true" size={13} />
              )}
              {publicId ? 'Replace image' : 'Upload image'}
            </label>
            <input
              ref={inputRef}
              id={`${id}-file`}
              type="file"
              accept={acceptAttribute}
              className="sr-only"
              disabled={uploading}
              aria-label={`${label} file`}
              aria-describedby={statusId}
              onChange={(event) => void handleFile(event.target.files?.[0])}
            />

            {publicId ? (
              confirmingDelete ? (
                <>
                  <AdminButton
                    size="sm"
                    variant="danger"
                    busy={deleting}
                    onClick={() => void handleDelete()}
                  >
                    Delete permanently
                  </AdminButton>
                  <AdminButton
                    size="sm"
                    variant="ghost"
                    onClick={() => setConfirmingDelete(false)}
                    disabled={deleting}
                  >
                    Keep image
                  </AdminButton>
                </>
              ) : (
                <>
                  <AdminButton size="sm" variant="ghost" onClick={() => setConfirmingDelete(true)}>
                    <Trash2 aria-hidden="true" size={13} /> Delete image
                  </AdminButton>
                  <AdminButton size="sm" variant="ghost" onClick={() => onChange(null)}>
                    Clear reference
                  </AdminButton>
                </>
              )
            ) : null}
          </div>

          {uploading ? (
            <div className="space-y-1">
              <progress
                value={progress ?? 0}
                max={100}
                aria-label={`${label} upload progress`}
                className="h-1.5 w-full accent-brand-gold"
              />
              <p className="text-[0.625rem] text-brand-muted">Uploading {progress ?? 0}%</p>
            </div>
          ) : null}

          <p
            id={statusId}
            role="status"
            aria-live="polite"
            className="text-[0.625rem] text-brand-muted"
          >
            {uploading
              ? `Uploading ${progress ?? 0}%`
              : (hint ?? 'Uploads are stored in the Blue Miror Cloudinary account.')}
          </p>

          {message ? (
            <p role="alert" className="text-xs text-[#8a3b34]">
              {message}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
