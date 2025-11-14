import { Schema, model, Document } from 'mongoose';

export interface ISharedLink extends Document {
  userId: Schema.Types.ObjectId;
  type: 'event' | 'itinerary';
  token: string;
  eventId?: string;
  eventName?: string;
  eventUrl?: string;
  itineraryData?: {
    events: Array<{
      id: string;
      name: string;
      start: string;
      url: string;
      imageUrl?: string;
      description?: string;
    }>;
  };
  createdAt: Date;
  expiresAt?: Date;
  isRevoked: boolean;
  accessCount: number;
}

const sharedLinkSchema = new Schema<ISharedLink>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ['event', 'itinerary'],
      required: true
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    eventId: {
      type: String
    },
    eventName: {
      type: String
    },
    eventUrl: {
      type: String
    },
    itineraryData: {
      events: [{
        id: String,
        name: String,
        start: String,
        url: String,
        imageUrl: String,
        description: String
      }]
    },
    isRevoked: {
      type: Boolean,
      default: false
    },
    accessCount: {
      type: Number,
      default: 0
    },
    expiresAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

export const SharedLink = model<ISharedLink>('SharedLink', sharedLinkSchema);
