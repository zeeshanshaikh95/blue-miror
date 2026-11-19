import { v2 as cloudinary } from 'cloudinary';

import { env } from './env.js';

const isConfigured = env.IS_CLOUDINARY_CONFIGURED;

if (isConfigured) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export const CLOUDINARY_FOLDERS = {
  branding: `${env.CLOUDINARY_FOLDER_PREFIX}/branding`,
  services: `${env.CLOUDINARY_FOLDER_PREFIX}/services`,
  gallery: `${env.CLOUDINARY_FOLDER_PREFIX}/gallery`,
  team: `${env.CLOUDINARY_FOLDER_PREFIX}/team`,
  homepage: `${env.CLOUDINARY_FOLDER_PREFIX}/homepage`,
} as const;

export const cloudinaryStatus = {
  isConfigured,
  folderPrefix: env.CLOUDINARY_FOLDER_PREFIX,
};

/**
 * Build a delivery URL for a stored Cloudinary public ID.
 *
 * The transformation asks Cloudinary for an auto-format, auto-quality image at
 * a bounded width so admin previews and public cards never decode a phone-sized
 * original (which is what made the editors lag).
 */
export function buildCloudinaryImageUrl(
  publicId: string | null | undefined,
  options: { width?: number } = {},
): string | null {
  const id = publicId?.trim();
  if (!id || !env.CLOUDINARY_CLOUD_NAME) return null;

  const width = options.width ?? 900;
  const transformation = `f_auto,q_auto,w_${width}`;

  return `https://res.cloudinary.com/${env.CLOUDINARY_CLOUD_NAME}/image/upload/${transformation}/${id}`;
}

export { cloudinary };
