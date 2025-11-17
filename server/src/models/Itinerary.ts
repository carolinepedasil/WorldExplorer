import { Schema, model, Document, Types } from 'mongoose';

export interface IEvent {
  id: string;
  name: string;
  date?: string;
  time?: string;
  venue?: string;
  city?: string;
  state?: string;
  country?: string;
  description?: string;
  imageUrl?: string;
  url?: string;
  priceRange?: {
    min?: number;
    max?: number;
    currency?: string;
  };
}

export interface IItinerary extends Document {
  userId: Types.ObjectId;
  name: string;
  description?: string;
  events: IEvent[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new Schema<IEvent>(
  {
    id: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    date: String,
    time: String,
    venue: String,
    city: String,
    state: String,
    country: String,
    description: String,
    imageUrl: String,
    url: String,
    priceRange: {
      min: Number,
      max: Number,
      currency: String
    }
  },
  { _id: false }
);

const itinerarySchema = new Schema<IItinerary>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      default: 'My Itinerary'
    },
    description: {
      type: String
    },
    events: {
      type: [eventSchema],
      default: []
    },
    isPublic: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Index for faster queries by user
itinerarySchema.index({ userId: 1, createdAt: -1 });

export const Itinerary = model<IItinerary>('Itinerary', itinerarySchema);
