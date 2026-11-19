import mongoose, { Schema, type Types } from 'mongoose';

export type ProductImage = {
  url: string;
  publicId: string;
  alt: string;
};

export type ProductDocument = {
  _id: Types.ObjectId;
  slug: string;
  name: string;
  brand: string | null;
  category: string;
  shortDescription: string;
  description: string[];
  features: string[];
  price: string | null;
  size: string | null;
  isFeatured: boolean;
  publishedAt: Date | null;
  isArchived: boolean;
  order: number;
  seo: { title: string | null; description: string | null };
  image: ProductImage | null;
  createdAt: Date;
  updatedAt: Date;
};

const productImageSchema = new Schema<ProductImage>(
  {
    url: {
      type: String,
      trim: true,
      maxlength: 500,
      required: [true, 'image url is required'],
    },
    publicId: {
      type: String,
      trim: true,
      maxlength: 300,
      required: [true, 'image publicId is required'],
    },
    alt: { type: String, trim: true, maxlength: 220, default: '' },
  },
  { _id: false },
);

const productSeoSchema = new Schema(
  {
    title: { type: String, trim: true, maxlength: 90, default: null },
    description: { type: String, trim: true, maxlength: 320, default: null },
  },
  { _id: false },
);

const productSchema = new Schema(
  {
    slug: {
      type: String,
      trim: true,
      lowercase: true,
      required: [true, 'slug is required'],
      unique: true,
      index: true,
    },
    name: {
      type: String,
      trim: true,
      minlength: 1,
      maxlength: 120,
      required: [true, 'name is required'],
    },
    brand: { type: String, trim: true, maxlength: 90, default: null },
    category: {
      type: String,
      trim: true,
      minlength: 1,
      maxlength: 90,
      required: [true, 'category is required'],
    },
    shortDescription: {
      type: String,
      trim: true,
      minlength: 1,
      maxlength: 240,
      required: [true, 'shortDescription is required'],
    },
    description: { type: [String], default: [] },
    features: { type: [String], default: [] },
    price: { type: String, trim: true, maxlength: 80, default: null },
    size: { type: String, trim: true, maxlength: 80, default: null },
    isFeatured: { type: Boolean, default: false },
    publishedAt: { type: Date, default: null },
    isArchived: { type: Boolean, default: false },
    order: { type: Number, default: 0, min: 0 },
    seo: { type: productSeoSchema, default: () => ({}) },
    image: { type: productImageSchema, default: null },
  },
  { timestamps: true, minimize: false, toJSON: { virtuals: true, versionKey: false } },
);

export const Product = mongoose.model('Product', productSchema);

export function lookupProductBySlug(slug: string) {
  return Product.findOne({
    slug: slug.trim().toLowerCase(),
    isArchived: false,
  }).lean<ProductDocument>();
}
