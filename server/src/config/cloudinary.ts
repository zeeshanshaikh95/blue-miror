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

export { cloudinary };
