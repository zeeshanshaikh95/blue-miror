import mongoose, { Schema, type Types } from 'mongoose';

export type AdminDocument = {
  _id: Types.ObjectId;
  email: string;
  passwordHash: string;
  role: 'superadmin';
  passwordUpdatedAt: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const adminSchema = new Schema(
  {
    email: {
      type: String,
      trim: true,
      lowercase: true,
      minlength: 1,
      required: [true, 'email is required'],
      unique: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'passwordHash is required'],
    },
    role: {
      type: String,
      enum: ['superadmin'],
      default: 'superadmin',
    },
    passwordUpdatedAt: {
      type: Date,
      required: [true, 'passwordUpdatedAt is required'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    minimize: false,
    toJSON: { virtuals: true, versionKey: false },
  },
);

export const Admin = mongoose.model('Admin', adminSchema);

export function lookupAdminByEmail(email: string) {
  return Admin.findOne({ email: email.trim().toLowerCase(), isActive: true }).lean<AdminDocument>();
}
