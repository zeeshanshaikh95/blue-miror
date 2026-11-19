import { Router } from 'express';

import {
  getPublicSettings,
  getPublicService,
  getPublicServiceList,
  getPublicProducts,
  getPublicProduct,
  getPublicGallery,
  getPublicTestimonials,
  getPublicTeam,
  getPublicFaqs,
} from '../services/public-projection.service.js';
import { AppError } from '../utils/app-error.js';

const listQuerySchema = {
  parse: (query: Record<string, unknown>) => {
    const q = (typeof query.q === 'string' ? query.q.trim() : '') || undefined;
    const category = (typeof query.category === 'string' ? query.category.trim() : '') || undefined;
    const featured =
      query.featured === 'true' || query.featured === 'false' ? query.featured : undefined;
    const limit = Math.max(1, Math.min(48, Number(query.limit) || 24));
    const page = Math.max(1, Math.min(100, Number(query.page) || 1));
    return { q, category, featured, limit, page };
  },
};

const galleryQuerySchema = {
  parse: (query: Record<string, unknown>) => {
    const category = (typeof query.category === 'string' ? query.category.trim() : '') || undefined;
    const limit = Math.max(1, Math.min(48, Number(query.limit) || 24));
    return { category, limit };
  },
};

const faqQuerySchema = {
  parse: (query: Record<string, unknown>) => {
    const category = (typeof query.category === 'string' ? query.category.trim() : '') || undefined;
    return { category };
  },
};

export const publicContentRouter = Router();

publicContentRouter.use((_request, response, next) => {
  response.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
  next();
});

publicContentRouter.get('/settings', async (_request, response) => {
  const settings = await getPublicSettings();
  response.json({ success: true, data: settings });
});

publicContentRouter.get('/services', async (request, response) => {
  const query = listQuerySchema.parse(request.query as Record<string, unknown>);
  const filters = {
    q: query.q,
    category: query.category,
    featured: query.featured === 'true' ? true : undefined,
    limit: query.limit,
    page: query.page,
  };

  const result = await getPublicServiceList(filters);

  response.json({
    success: true,
    data: {
      isDemo: result.isDemo,
      items: result.items,
      categories: result.categories,
      total: result.total,
      // Mirrors meta so paginated listings can render page controls.
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    },
    meta: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    },
  });
});

publicContentRouter.get('/products', async (request, response) => {
  const query = listQuerySchema.parse(request.query as Record<string, unknown>);
  const filters = {
    q: query.q,
    category: query.category,
    featured: query.featured === 'true' ? true : undefined,
    limit: query.limit,
    page: query.page,
  };

  const result = await getPublicProducts(filters);

  response.json({
    success: true,
    data: {
      isDemo: result.isDemo,
      items: result.items,
      categories: result.categories,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    },
    meta: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    },
  });
});

publicContentRouter.get('/products/:slug', async (request, response) => {
  const slug = typeof request.params.slug === 'string' ? request.params.slug : '';
  const product = await getPublicProduct(slug);

  if (!product) {
    throw new AppError(404, 'PRODUCT_NOT_FOUND', 'This product could not be found.');
  }

  response.json({ success: true, data: product });
});

publicContentRouter.get('/services/:slug', async (request, response) => {
  const slug = typeof request.params.slug === 'string' ? request.params.slug : '';
  const service = await getPublicService(slug);

  if (!service) {
    throw new AppError(404, 'SERVICE_NOT_FOUND', 'This treatment could not be found.');
  }

  response.json({ success: true, data: service });
});

publicContentRouter.get('/gallery', async (request, response) => {
  const query = galleryQuerySchema.parse(request.query as Record<string, unknown>);
  const gallery = await getPublicGallery(query.category);

  response.json({
    success: true,
    data: {
      isDemo: gallery.isDemo,
      items: gallery.items,
      categories: gallery.categories,
      total: gallery.total,
    },
  });
});

publicContentRouter.get('/testimonials', async (_request, response) => {
  const testimonials = await getPublicTestimonials();
  response.json({ success: true, data: testimonials });
});

publicContentRouter.get('/team', async (_request, response) => {
  const team = await getPublicTeam();
  response.json({ success: true, data: team });
});

publicContentRouter.get('/faqs', async (request, response) => {
  const query = faqQuerySchema.parse(request.query as Record<string, unknown>);
  const faqs = await getPublicFaqs(query.category);

  response.json({
    success: true,
    data: {
      isDemo: faqs.isDemo,
      items: faqs.items,
      categories: faqs.categories,
      total: faqs.total,
    },
  });
});
