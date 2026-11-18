import { Router } from 'express';
import { isValidObjectId } from 'mongoose';

import {
  Category,
  Faq,
  Gallery,
  Service,
  Team,
  Testimonial,
  WebsiteSettings,
} from '../models/index.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import {
  CategoryUpsertSchema,
  ServiceCreateSchema,
  ServiceUpdateSchema,
  GalleryCreateSchema,
  GalleryUpdateSchema,
  TeamCreateSchema,
  TeamUpdateSchema,
  TestimonialCreateSchema,
  TestimonialUpdateSchema,
  FaqCreateSchema,
  FaqUpdateSchema,
  SettingsSchema,
  buildPaginated,
} from '../lib/index.js';
import { AppError } from '../utils/app-error.js';
import { logger } from '../utils/logger.js';

export const adminRouter = Router();

adminRouter.use('/admin', (request, _response, next) => {
  logger.info(
    {
      adminId: (request as AuthenticatedRequest).user.id,
      method: request.method,
      path: request.originalUrl,
    },
    'Admin request start',
  );
  next();
});

adminRouter.get('/admin/health', (_request, response) => {
  response.json({ ok: true });
});

// -----------------------------------------------------------------------------------
// Services
// -----------------------------------------------------------------------------------

adminRouter.get('/admin/services', async (request, response, next) => {
  try {
    const {
      page = 1,
      limit = 24,
      category,
      q,
    } = request.query as {
      page?: string;
      limit?: string;
      category?: string;
      q?: string;
    };
    const skip = Math.max(
      0,
      (Math.max(1, Number(page) || 1) - 1) * Math.max(1, Math.min(48, Number(limit) || 24)),
    );
    const limitCount = Math.max(1, Math.min(48, Number(limit) || 24));

    const match: Record<string, unknown> = { isArchived: false };
    if (category && typeof category === 'string') match.category = category.trim();
    if (q && typeof q === 'string' && q.trim()) {
      const pattern = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      match.$or = [{ name: pattern }, { shortDescription: pattern }, { category: pattern }];
    }

    const [items, total] = await Promise.all([
      Service.find(match)
        .sort({ order: 1, isFeatured: -1, name: 1 })
        .skip(skip)
        .limit(limitCount)
        .lean(),
      Service.countDocuments(match),
    ]);

    return response.json({
      success: true,
      data: buildPaginated(
        items.map((item) => ({ ...item, id: item._id })),
        Math.max(1, Number(page) || 1),
        limitCount,
        total,
      ),
    });
  } catch (error) {
    next(error);
  }
});

adminRouter.post('/admin/services', async (request, response, next) => {
  try {
    const input = ServiceCreateSchema.parse(request.body);
    const service = await Service.create(input);
    return response
      .status(201)
      .json({ success: true, data: { ...service.toObject(), id: service._id } });
  } catch (error) {
    next(error);
  }
});

adminRouter.get('/admin/services/:id', async (request, response, next) => {
  try {
    const service = await Service.findOne({ _id: request.params.id, isArchived: false }).lean();
    if (!service) return next(new AppError(404, 'SERVICE_NOT_FOUND', 'Service not found.'));
    return response.json({ success: true, data: { ...service, id: service._id } });
  } catch (error) {
    next(error);
  }
});

adminRouter.put('/admin/services/:id', async (request, response, next) => {
  try {
    const input = ServiceUpdateSchema.parse(request.body);
    const service = await Service.findOneAndUpdate(
      { _id: request.params.id },
      { $set: input },
      { new: true, runValidators: true },
    ).lean();
    if (!service) return next(new AppError(404, 'SERVICE_NOT_FOUND', 'Service not found.'));
    return response.json({ success: true, data: { ...service, id: service._id } });
  } catch (error) {
    next(error);
  }
});

adminRouter.delete('/admin/services/:id', async (request, response, next) => {
  try {
    const service = await Service.findOneAndUpdate(
      { _id: request.params.id },
      { $set: { isArchived: true } },
      { new: true },
    ).lean();
    if (!service) return next(new AppError(404, 'SERVICE_NOT_FOUND', 'Service not found.'));
    return response.json({ success: true, data: { ...service, id: service._id } });
  } catch (error) {
    next(error);
  }
});

adminRouter.patch('/admin/services/reorder', async (request, response, next) => {
  try {
    const body = request.body as { ids?: unknown };
    const ids = Array.isArray(body?.ids) ? body.ids : [];

    if (
      ids.length === 0 ||
      ids.length > 200 ||
      ids.some((id) => typeof id !== 'string' || !isValidObjectId(id))
    ) {
      throw new AppError(
        422,
        'SERVICE_REORDER_INVALID',
        'Send an ordered list of every service id.',
      );
    }

    await Promise.all(
      ids.map((id, index) =>
        Service.updateOne({ _id: id as string, isArchived: false }, { $set: { order: index } }),
      ),
    );

    const items = await Service.find({ isArchived: false }).sort({ order: 1, name: 1 }).lean();

    return response.json({
      success: true,
      data: { items: items.map((item) => ({ ...item, id: item._id })), total: items.length },
    });
  } catch (error) {
    next(error);
  }
});

// -----------------------------------------------------------------------------------
// Categories
// -----------------------------------------------------------------------------------

adminRouter.get('/admin/categories', async (_request, response, next) => {
  try {
    const [items, usage] = await Promise.all([
      Category.find({ isArchived: false }).sort({ order: 1, name: 1 }).lean(),
      // One grouped count covers every service, not just the first page.
      Service.aggregate<{ _id: string; count: number }>([
        { $match: { isArchived: false } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
      ]),
    ]);
    const counts = new Map(usage.map((row) => [row._id, row.count]));

    return response.json({
      success: true,
      data: {
        items: items.map((item) => ({ ...item, serviceCount: counts.get(item.slug) ?? 0 })),
        total: items.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

adminRouter.post('/admin/categories', async (request, response, next) => {
  try {
    const input = CategoryUpsertSchema.parse(request.body);
    const category = await Category.create(input);
    return response
      .status(201)
      .json({ success: true, data: { ...category.toObject(), id: category._id } });
  } catch (error) {
    next(error);
  }
});

adminRouter.put('/admin/categories/:slug', async (request, response, next) => {
  try {
    const input = CategoryUpsertSchema.partial().parse(request.body);
    const category = await Category.findOneAndUpdate(
      { slug: request.params.slug, isArchived: false },
      { $set: input },
      { new: true, runValidators: true },
    ).lean();
    if (!category) return next(new AppError(404, 'CATEGORY_NOT_FOUND', 'Category not found.'));
    return response.json({ success: true, data: { ...category, id: category._id } });
  } catch (error) {
    next(error);
  }
});

adminRouter.delete('/admin/categories/:slug', async (request, response, next) => {
  try {
    const slug = typeof request.params.slug === 'string' ? request.params.slug : '';

    // Checked in the database so no service count is missed by pagination.
    const inUse = await Service.countDocuments({ category: slug, isArchived: false });

    if (inUse > 0) {
      return next(
        new AppError(
          409,
          'CATEGORY_IN_USE',
          `This category is used by ${inUse} service${inUse === 1 ? '' : 's'}. Reassign them before archiving.`,
          { slug: 'Reassign every service in this category first.' },
        ),
      );
    }

    const category = await Category.findOneAndUpdate(
      { slug: request.params.slug },
      { $set: { isArchived: true } },
      { new: true },
    ).lean();
    if (!category) return next(new AppError(404, 'CATEGORY_NOT_FOUND', 'Category not found.'));
    return response.json({ success: true, data: { ...category, id: category._id } });
  } catch (error) {
    next(error);
  }
});

adminRouter.patch('/admin/categories/reorder', async (request, response, next) => {
  try {
    const body = request.body as { slugs?: unknown };
    const slugs = Array.isArray(body?.slugs) ? body.slugs : [];

    if (
      slugs.length === 0 ||
      slugs.length > 200 ||
      slugs.some((slug) => typeof slug !== 'string' || !slug.trim())
    ) {
      throw new AppError(
        422,
        'CATEGORY_REORDER_INVALID',
        'Send an ordered list of every category slug.',
      );
    }

    await Promise.all(
      slugs.map((slug, index) =>
        Category.updateOne(
          { slug: (slug as string).trim().toLowerCase(), isArchived: false },
          { $set: { order: index } },
        ),
      ),
    );

    const items = await Category.find({ isArchived: false }).sort({ order: 1, name: 1 }).lean();

    return response.json({
      success: true,
      data: { items: items.map((item) => ({ ...item, id: item._id })), total: items.length },
    });
  } catch (error) {
    next(error);
  }
});

// -----------------------------------------------------------------------------------
// Gallery
// -----------------------------------------------------------------------------------

adminRouter.get('/admin/gallery', async (_request, response, next) => {
  try {
    const items = await Gallery.find({ isArchived: false }).sort({ createdAt: -1 }).lean();
    return response.json({ success: true, data: { items, total: items.length } });
  } catch (error) {
    next(error);
  }
});

adminRouter.post('/admin/gallery', async (request, response, next) => {
  try {
    const input = GalleryCreateSchema.parse(request.body);
    const item = await Gallery.create(input);
    return response.status(201).json({ success: true, data: { ...item.toObject(), id: item._id } });
  } catch (error) {
    next(error);
  }
});

adminRouter.put('/admin/gallery/:id', async (request, response, next) => {
  try {
    const input = GalleryUpdateSchema.parse(request.body);
    const item = await Gallery.findOneAndUpdate(
      { _id: request.params.id, isArchived: false },
      { $set: input },
      { new: true, runValidators: true },
    ).lean();
    if (!item) return next(new AppError(404, 'GALLERY_ITEM_NOT_FOUND', 'Gallery item not found.'));
    return response.json({ success: true, data: { ...item, id: item._id } });
  } catch (error) {
    next(error);
  }
});

adminRouter.delete('/admin/gallery/:id', async (request, response, next) => {
  try {
    const item = await Gallery.findOneAndUpdate(
      { _id: request.params.id },
      { $set: { isArchived: true } },
      { new: true },
    ).lean();
    if (!item) return next(new AppError(404, 'GALLERY_ITEM_NOT_FOUND', 'Gallery item not found.'));
    return response.json({ success: true, data: { ...item, id: item._id } });
  } catch (error) {
    next(error);
  }
});

// -----------------------------------------------------------------------------------
// Team
// -----------------------------------------------------------------------------------

adminRouter.get('/admin/team', async (_request, response, next) => {
  try {
    const items = await Team.find({ isArchived: false }).sort({ createdAt: -1 }).lean();
    return response.json({ success: true, data: { items, total: items.length } });
  } catch (error) {
    next(error);
  }
});

adminRouter.post('/admin/team', async (request, response, next) => {
  try {
    const input = TeamCreateSchema.parse(request.body);
    const member = await Team.create(input);
    return response
      .status(201)
      .json({ success: true, data: { ...member.toObject(), id: member._id } });
  } catch (error) {
    next(error);
  }
});

adminRouter.put('/admin/team/:id', async (request, response, next) => {
  try {
    const input = TeamUpdateSchema.parse(request.body);
    const member = await Team.findOneAndUpdate(
      { _id: request.params.id, isArchived: false },
      { $set: input },
      { new: true, runValidators: true },
    ).lean();
    if (!member) return next(new AppError(404, 'TEAM_MEMBER_NOT_FOUND', 'Team member not found.'));
    return response.json({ success: true, data: { ...member, id: member._id } });
  } catch (error) {
    next(error);
  }
});

adminRouter.delete('/admin/team/:id', async (request, response, next) => {
  try {
    const member = await Team.findOneAndUpdate(
      { _id: request.params.id },
      { $set: { isArchived: true } },
      { new: true },
    ).lean();
    if (!member) return next(new AppError(404, 'TEAM_MEMBER_NOT_FOUND', 'Team member not found.'));
    return response.json({ success: true, data: { ...member, id: member._id } });
  } catch (error) {
    next(error);
  }
});

// -----------------------------------------------------------------------------------
// Testimonials
// -----------------------------------------------------------------------------------

adminRouter.get('/admin/testimonials', async (_request, response, next) => {
  try {
    const items = await Testimonial.find({ isArchived: false }).sort({ createdAt: -1 }).lean();
    return response.json({ success: true, data: { items, total: items.length } });
  } catch (error) {
    next(error);
  }
});

adminRouter.post('/admin/testimonials', async (request, response, next) => {
  try {
    const input = TestimonialCreateSchema.parse(request.body);
    const testimonial = await Testimonial.create(input);
    return response
      .status(201)
      .json({ success: true, data: { ...testimonial.toObject(), id: testimonial._id } });
  } catch (error) {
    next(error);
  }
});

adminRouter.put('/admin/testimonials/:id', async (request, response, next) => {
  try {
    const input = TestimonialUpdateSchema.parse(request.body);
    const testimonial = await Testimonial.findOneAndUpdate(
      { _id: request.params.id, isArchived: false },
      { $set: input },
      { new: true, runValidators: true },
    ).lean();
    if (!testimonial)
      return next(new AppError(404, 'TESTIMONIAL_NOT_FOUND', 'Testimonial not found.'));
    return response.json({ success: true, data: { ...testimonial, id: testimonial._id } });
  } catch (error) {
    next(error);
  }
});

adminRouter.delete('/admin/testimonials/:id', async (request, response, next) => {
  try {
    const testimonial = await Testimonial.findOneAndUpdate(
      { _id: request.params.id },
      { $set: { isArchived: true } },
      { new: true },
    ).lean();
    if (!testimonial)
      return next(new AppError(404, 'TESTIMONIAL_NOT_FOUND', 'Testimonial not found.'));
    return response.json({ success: true, data: { ...testimonial, id: testimonial._id } });
  } catch (error) {
    next(error);
  }
});

// -----------------------------------------------------------------------------------
// FAQs
// -----------------------------------------------------------------------------------

adminRouter.get('/admin/faqs', async (_request, response, next) => {
  try {
    const items = await Faq.find({ isArchived: false }).sort({ createdAt: -1 }).lean();
    return response.json({ success: true, data: { items, total: items.length } });
  } catch (error) {
    next(error);
  }
});

adminRouter.post('/admin/faqs', async (request, response, next) => {
  try {
    const input = FaqCreateSchema.parse(request.body);
    const faq = await Faq.create(input);
    return response.status(201).json({ success: true, data: { ...faq.toObject(), id: faq._id } });
  } catch (error) {
    next(error);
  }
});

adminRouter.put('/admin/faqs/:id', async (request, response, next) => {
  try {
    const input = FaqUpdateSchema.parse(request.body);
    const faq = await Faq.findOneAndUpdate(
      { _id: request.params.id, isArchived: false },
      { $set: input },
      { new: true, runValidators: true },
    ).lean();
    if (!faq) return next(new AppError(404, 'FAQ_NOT_FOUND', 'FAQ not found.'));
    return response.json({ success: true, data: { ...faq, id: faq._id } });
  } catch (error) {
    next(error);
  }
});

adminRouter.delete('/admin/faqs/:id', async (request, response, next) => {
  try {
    const faq = await Faq.findOneAndUpdate(
      { _id: request.params.id },
      { $set: { isArchived: true } },
      { new: true },
    ).lean();
    if (!faq) return next(new AppError(404, 'FAQ_NOT_FOUND', 'FAQ not found.'));
    return response.json({ success: true, data: { ...faq, id: faq._id } });
  } catch (error) {
    next(error);
  }
});

// -----------------------------------------------------------------------------------
// Website settings
// -----------------------------------------------------------------------------------

adminRouter.get('/admin/settings', async (_request, response, next) => {
  try {
    const settings = await WebsiteSettings.findOne().lean();
    if (!settings)
      return next(new AppError(404, 'SETTINGS_NOT_FOUND', 'Website settings not found.'));
    return response.json({ success: true, data: { ...settings, id: settings._id } });
  } catch (error) {
    next(error);
  }
});

adminRouter.put('/admin/settings', async (request, response, next) => {
  try {
    const input = SettingsSchema.partial().parse(request.body);
    const settings = await WebsiteSettings.findOneAndUpdate(
      {},
      { $set: { ...input, updatedAt: new Date() } },
      { new: true, upsert: true, runValidators: true },
    ).lean();
    return response.json({ success: true, data: { ...settings, id: settings._id } });
  } catch (error) {
    next(error);
  }
});
