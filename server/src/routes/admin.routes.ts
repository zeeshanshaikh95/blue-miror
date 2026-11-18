import { Router } from 'express';

import { adminRouter } from '../controllers/admin.controller.js';
import { auditRouter } from '../controllers/audit.controller.js';
import { inboxRouter } from '../controllers/inbox.controller.js';
import { mediaRouter } from '../controllers/media.controller.js';
import { authRouter, logoutHandler } from './auth.routes.js';
import { requireAdminAuth, requireAdminRole } from '../middleware/auth.middleware.js';
import { auditAdminWrites } from '../middleware/audit.middleware.js';

export const adminRoutes = Router();

// Public admin surface: login (throttled) and one-time bootstrap.
adminRoutes.use(authRouter);

// Logout requires authentication but not a particular role, so it is mounted
// before the role guard; it can only ever revoke the caller's own session.
adminRoutes.post('/admin/logout', requireAdminAuth, logoutHandler);

// Everything else under /admin requires a valid superadmin session.
adminRoutes.use('/admin', requireAdminAuth, requireAdminRole, auditAdminWrites);
adminRoutes.use(adminRouter);
adminRoutes.use(inboxRouter);
adminRoutes.use(mediaRouter);
adminRoutes.use(auditRouter);
