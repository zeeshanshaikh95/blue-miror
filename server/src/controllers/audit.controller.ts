import { Router } from 'express';

import { listAuditLogs } from '../services/audit.service.js';

export const auditRouter = Router();

// Mounted behind requireAdminAuth + requireAdminRole in admin.routes.ts.
auditRouter.get('/admin/audit', async (request, response, next) => {
  try {
    const { page, limit, action } = request.query as {
      page?: string;
      limit?: string;
      action?: string;
    };

    const result = await listAuditLogs({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      action: typeof action === 'string' && action.trim() ? action.trim() : undefined,
    });

    return response.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});
