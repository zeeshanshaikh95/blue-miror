import { randomUUID } from 'node:crypto';

import { CLOUDINARY_FOLDERS, cloudinary, cloudinaryStatus } from '../config/cloudinary.js';
import { AppError } from '../utils/app-error.js';

export type MediaFolder = keyof typeof CLOUDINARY_FOLDERS;

export const mediaFolders = Object.keys(CLOUDINARY_FOLDERS) as MediaFolder[];

/** Matches the multipart limit enforced by the upload middleware. */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export type MediaAsset = {
  url: string;
  publicId: string;
  alt: string;
  width: number | null;
  height: number | null;
  format: string;
  bytes: number;
  folder: MediaFolder;
};

const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/**
 * Sniffs the real image type from the bytes. The declared MIME type and the
 * filename are never trusted; SVG and GIF are deliberately rejected.
 */
export function detectImageFormat(buffer: Buffer): { mime: string; extension: string } | null {
  if (buffer.length < 12) return null;

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mime: 'image/jpeg', extension: 'jpg' };
  }

  if (buffer.subarray(0, 8).equals(pngSignature)) {
    return { mime: 'image/png', extension: 'png' };
  }

  const riff = buffer.subarray(0, 4).toString('ascii') === 'RIFF';
  const webp = buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  if (riff && webp) {
    return { mime: 'image/webp', extension: 'webp' };
  }

  return null;
}

export function isMediaFolder(value: unknown): value is MediaFolder {
  return typeof value === 'string' && (mediaFolders as string[]).includes(value);
}

export function resolveMediaFolder(value: unknown): MediaFolder {
  if (value === undefined || value === null || value === '') return 'gallery';
  if (!isMediaFolder(value)) {
    throw new AppError(422, 'MEDIA_FOLDER_INVALID', 'That media folder is not supported.');
  }
  return value;
}

export function assertOwnedPublicId(publicId: unknown): string {
  const value = typeof publicId === 'string' ? publicId.trim() : '';

  if (!value) {
    throw new AppError(422, 'MEDIA_PUBLIC_ID_REQUIRED', 'A media public id is required.');
  }

  const prefix = `${cloudinaryStatus.folderPrefix}/`;
  if (!value.startsWith(prefix) || value.includes('..')) {
    throw new AppError(
      422,
      'MEDIA_PUBLIC_ID_INVALID',
      'Only assets inside this project’s Cloudinary folder can be deleted.',
    );
  }

  return value;
}

function assertCloudinaryConfigured(): void {
  if (!cloudinaryStatus.isConfigured) {
    throw new AppError(
      503,
      'MEDIA_UNAVAILABLE',
      'Image uploads are not configured for this environment.',
    );
  }
}

export function assertUploadableImage(buffer: Buffer): { mime: string; extension: string } {
  if (!buffer || buffer.length === 0) {
    throw new AppError(422, 'MEDIA_FILE_REQUIRED', 'Choose an image to upload.');
  }

  if (buffer.length > MAX_UPLOAD_BYTES) {
    throw new AppError(413, 'MEDIA_FILE_TOO_LARGE', 'Images must be 5 MB or smaller.');
  }

  const format = detectImageFormat(buffer);

  if (!format) {
    throw new AppError(
      415,
      'MEDIA_TYPE_UNSUPPORTED',
      'Only JPEG, PNG and WebP images are accepted.',
    );
  }

  return format;
}

/**
 * Uploads a validated image to the project’s Cloudinary folder. Filenames are
 * generated server-side, so a crafted client filename cannot influence the
 * stored public id. The API secret never leaves the server.
 */
export async function uploadMedia(input: {
  buffer: Buffer;
  folder: MediaFolder;
  alt: string;
}): Promise<MediaAsset> {
  const format = assertUploadableImage(input.buffer);
  assertCloudinaryConfigured();

  const publicId = `${Date.now()}-${randomUUID().slice(0, 8)}`;

  const result = await new Promise<{
    secure_url: string;
    public_id: string;
    width?: number;
    height?: number;
    format?: string;
    bytes?: number;
  }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: CLOUDINARY_FOLDERS[input.folder],
        public_id: publicId,
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        overwrite: false,
        transformation: [{ width: 1920, crop: 'limit' }],
      },
      (error, uploaded) => {
        if (error || !uploaded) {
          reject(
            new AppError(
              502,
              'MEDIA_UPLOAD_FAILED',
              'The image could not be stored. Please try again.',
            ),
          );
          return;
        }
        resolve(uploaded as never);
      },
    );

    stream.end(input.buffer);
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    alt: input.alt,
    width: result.width ?? null,
    height: result.height ?? null,
    format: result.format ?? format.extension,
    bytes: result.bytes ?? input.buffer.length,
    folder: input.folder,
  };
}

/** Deletes an asset only when it lives inside this project’s folder prefix. */
export async function deleteMedia(publicId: unknown): Promise<{ deleted: boolean }> {
  const owned = assertOwnedPublicId(publicId);
  assertCloudinaryConfigured();

  const result = await new Promise<{ result: string }>((resolve, reject) => {
    cloudinary.uploader.destroy(
      owned,
      { resource_type: 'image', invalidate: true },
      (error, done) => {
        if (error || !done) {
          reject(
            new AppError(
              502,
              'MEDIA_DELETE_FAILED',
              'The image could not be removed. Please try again.',
            ),
          );
          return;
        }
        resolve(done as never);
      },
    );
  });

  return { deleted: result.result === 'ok' || result.result === 'not found' };
}
