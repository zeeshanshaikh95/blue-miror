import mongoose, { Schema, type Types } from 'mongoose';

export type AdminSessionDocument = {
  _id: Types.ObjectId;
  tokenId: string;
  adminId: Types.ObjectId;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

const adminSessionSchema = new Schema(
  {
    // `jti` claim of the issued token. Unique per issued session.
    tokenId: {
      type: String,
      required: [true, 'tokenId is required'],
      unique: true,
      index: true,
    },
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
      required: [true, 'adminId is required'],
      index: true,
    },
    // TTL index: MongoDB removes the document shortly after expiry, so revoked
    // and expired rows do not accumulate.
    expiresAt: {
      type: Date,
      required: [true, 'expiresAt is required'],
      expires: 0,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    minimize: false,
    toJSON: { virtuals: true, versionKey: false },
  },
);

// Supports "revoke all sessions for this admin" without scanning revocation rows.
adminSessionSchema.index({ adminId: 1, revokedAt: 1 });

export const AdminSession = mongoose.model('AdminSession', adminSessionSchema);

export function lookupSessionByTokenId(tokenId: string) {
  return AdminSession.findOne({ tokenId }).lean<AdminSessionDocument>();
}
