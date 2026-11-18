import mongoose, { Schema, type Model } from 'mongoose';

/**
 * Append-only record of administrative actions. Deliberately stores metadata
 * only: never request bodies, credentials, tokens or customer message content.
 */
export type AuditLogDocument = {
  _id: mongoose.Types.ObjectId;
  action: string;
  method: string;
  path: string;
  statusCode: number;
  adminId: string;
  adminEmail: string;
  entityType: string | null;
  entityId: string | null;
  requestId: string | null;
  createdAt: Date;
};

const auditLogSchema = new Schema(
  {
    action: { type: String, trim: true, required: true, index: true },
    method: { type: String, trim: true, required: true },
    path: { type: String, trim: true, required: true, maxlength: 300 },
    statusCode: { type: Number, required: true },
    adminId: { type: String, trim: true, required: true, index: true },
    // Empty for failed sign-ins: the attempted address is never stored.
    adminEmail: { type: String, trim: true, default: '' },
    entityType: { type: String, trim: true, default: null },
    entityId: { type: String, trim: true, maxlength: 120, default: null },
    requestId: { type: String, trim: true, maxlength: 128, default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false, toJSON: { versionKey: false } },
);

// Entries are operational evidence, not permanent records: expire them after a
// year so the collection cannot grow without bound.
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 365 });

export const AuditLog: Model<AuditLogDocument> =
  (mongoose.models.AuditLog as Model<AuditLogDocument> | undefined) ??
  mongoose.model<AuditLogDocument>('AuditLog', auditLogSchema);
