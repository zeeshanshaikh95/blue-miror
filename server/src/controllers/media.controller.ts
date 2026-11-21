import { Router, type NextFunction, type Request, type Response } from 'express';
import multer from 'multer';

import {
  MAX_UPLOAD_BYTES,
  deleteMedia,
  resolveMediaFolder,
  uploadMedia,
} from '../services/media.service.js';
import { AppError } from '../utils/app-error.js';

export const mediaRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_UPLOAD_BYTES,
    files: 1,
    fields: 4,
    // Bound the multipart envelope itself, not just the image payload.
    fieldNameSize: 100,
    fieldSize: 2048,
    parts: 8,
  },
});

function singleImage(request: Request, response: Response, next: NextFunction) {
  upload.single('file')(request, response, (error: unknown) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        next(new AppError(413, 'MEDIA_FILE_TOO_LARGE', 'Images must be 5 MB or smaller.'));
        return;
      }
      next(new AppError(422, 'MEDIA_UPLOAD_INVALID', 'Send exactly one image file.'));
      return;
    }

    next(error);
  });
}

mediaRouter.post('/admin/uploads', singleImage, async (request, response, next) => {
  try {
    const file = request.file;
    if (!file) {
      throw new AppError(422, 'MEDIA_FILE_REQUIRED', 'Choose an image to upload.');
    }

    const body = request.body as { folder?: unknown; alt?: unknown };
    const folder = resolveMediaFolder(body.folder);
    const alt = typeof body.alt === 'string' ? body.alt.trim().slice(0, 220) : '';

    const asset = await uploadMedia({ buffer: file.buffer, folder, alt });

    return response.status(201).json({ success: true, data: asset });
  } catch (error) {
    return next(error);
  }
});

mediaRouter.delete('/admin/uploads', async (request, response, next) => {
  try {
    const body = request.body as { publicId?: unknown };
    const result = await deleteMedia(body?.publicId);
    return response.json({ success: true, data: result });
  } catch (error) {
    return next(error);
  }
});
