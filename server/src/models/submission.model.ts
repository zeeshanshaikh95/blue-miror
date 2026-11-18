import mongoose, { Schema, type Types } from 'mongoose';

export type AppointmentStatus =
  'pending' | 'contacted' | 'confirmed' | 'rescheduled' | 'completed' | 'cancelled';

export type AppointmentDocument = {
  _id: Types.ObjectId;
  bookingRef: string;
  fullName: string;
  phone: string;
  email: string | null;
  serviceSlug: string | null;
  serviceName: string | null;
  preferredDate: string;
  preferredTime: string;
  message: string | null;
  status: AppointmentStatus;
  adminNotes: string | null;
  statusHistory: Array<{ status: AppointmentStatus; at: Date; note: string | null }>;
  source: string;
  consentAccepted: boolean;
  ipHash: string | null;
  userAgent: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type EnquiryStatus = 'new' | 'contacted' | 'closed';

export type EnquiryDocument = {
  _id: Types.ObjectId;
  name: string;
  phone: string;
  email: string | null;
  serviceSlug: string | null;
  serviceName: string | null;
  message: string;
  status: EnquiryStatus;
  adminNotes: string | null;
  source: string;
  ipHash: string | null;
  userAgent: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ContactStatus = 'new' | 'in_progress' | 'closed';

export type ContactSubmissionDocument = {
  _id: Types.ObjectId;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: ContactStatus;
  adminNotes: string | null;
  ipHash: string | null;
  userAgent: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const statusHistorySchema = new Schema(
  {
    status: {
      type: String,
      enum: ['pending', 'contacted', 'confirmed', 'rescheduled', 'completed', 'cancelled'],
      required: [true, 'statusHistory.status is required'],
    },
    at: { type: Date, required: [true, 'statusHistory.at is required'] },
    note: { type: String, trim: true, maxlength: 500, default: null },
  },
  { _id: false },
);

const appointmentSchema = new Schema(
  {
    bookingRef: {
      type: String,
      trim: true,
      required: [true, 'bookingRef is required'],
      unique: true,
      index: true,
    },
    fullName: {
      type: String,
      trim: true,
      minlength: 1,
      maxlength: 120,
      required: [true, 'fullName is required'],
    },
    phone: { type: String, trim: true, required: [true, 'phone is required'], index: true },
    email: { type: String, trim: true, lowercase: true, maxlength: 254, default: null },
    serviceSlug: { type: String, trim: true, maxlength: 150, default: null },
    serviceName: { type: String, trim: true, maxlength: 160, default: null },
    preferredDate: { type: String, trim: true, required: [true, 'preferredDate is required'] },
    preferredTime: { type: String, trim: true, required: [true, 'preferredTime is required'] },
    message: { type: String, trim: true, maxlength: 1000, default: null },
    status: {
      type: String,
      enum: ['pending', 'contacted', 'confirmed', 'rescheduled', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    adminNotes: { type: String, trim: true, maxlength: 2000, default: null },
    statusHistory: { type: [statusHistorySchema], default: [] },
    source: { type: String, trim: true, maxlength: 40, default: 'website' },
    consentAccepted: {
      type: Boolean,
      required: [true, 'consentAccepted is required'],
      validate: {
        validator: (value: boolean) => value === true,
        message: 'Consent is required before an appointment request is sent.',
      },
    },
    ipHash: { type: String, trim: true, maxlength: 64, default: null },
    userAgent: { type: String, trim: true, maxlength: 400, default: null },
  },
  { timestamps: true, minimize: false, toJSON: { virtuals: true, versionKey: false } },
);

const enquirySchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      minlength: 1,
      maxlength: 120,
      required: [true, 'name is required'],
    },
    phone: { type: String, trim: true, required: [true, 'phone is required'], index: true },
    email: { type: String, trim: true, lowercase: true, maxlength: 254, default: null },
    serviceSlug: { type: String, trim: true, maxlength: 150, default: null },
    serviceName: { type: String, trim: true, maxlength: 160, default: null },
    message: {
      type: String,
      trim: true,
      minlength: 1,
      maxlength: 1000,
      required: [true, 'message is required'],
    },
    status: { type: String, enum: ['new', 'contacted', 'closed'], default: 'new', index: true },
    adminNotes: { type: String, trim: true, maxlength: 2000, default: null },
    source: { type: String, trim: true, maxlength: 40, default: 'website' },
    ipHash: { type: String, trim: true, maxlength: 64, default: null },
    userAgent: { type: String, trim: true, maxlength: 400, default: null },
  },
  { timestamps: true, minimize: false, toJSON: { virtuals: true, versionKey: false } },
);

const contactSubmissionSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      minlength: 1,
      maxlength: 120,
      required: [true, 'name is required'],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 254,
      required: [true, 'email is required'],
    },
    phone: { type: String, trim: true, maxlength: 20, default: null },
    subject: { type: String, trim: true, maxlength: 160, default: null },
    message: {
      type: String,
      trim: true,
      minlength: 1,
      maxlength: 1000,
      required: [true, 'message is required'],
    },
    status: {
      type: String,
      enum: ['new', 'in_progress', 'closed'],
      default: 'new',
      index: true,
    },
    adminNotes: { type: String, trim: true, maxlength: 2000, default: null },
    ipHash: { type: String, trim: true, maxlength: 64, default: null },
    userAgent: { type: String, trim: true, maxlength: 400, default: null },
  },
  { timestamps: true, minimize: false, toJSON: { virtuals: true, versionKey: false } },
);

appointmentSchema.index({ status: 1, preferredDate: 1 });
appointmentSchema.index({ createdAt: -1 });
appointmentSchema.index({ phone: 1, createdAt: -1 });
enquirySchema.index({ status: 1, createdAt: -1 });
contactSubmissionSchema.index({ status: 1, createdAt: -1 });

export const Appointment = mongoose.model('Appointment', appointmentSchema);
export const Enquiry = mongoose.model('Enquiry', enquirySchema);
export const ContactSubmission = mongoose.model('ContactSubmission', contactSubmissionSchema);
