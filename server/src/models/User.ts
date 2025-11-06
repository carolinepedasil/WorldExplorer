import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  githubId?: string;
  username: string;
  email: string;
  avatar?: string;
  displayName?: string;
  password?: string;
  provider: 'github' | 'local';
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    githubId: {
      type: String,
      sparse: true
    },
    username: {
      type: String,
      required: true,
      unique: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    avatar: {
      type: String
    },
    displayName: {
      type: String
    },
    password: {
      type: String
    },
    provider: {
      type: String,
      enum: ['github', 'local'],
      default: 'local'
    }
  },
  {
    timestamps: true
  }
);

export const User = model<IUser>('User', userSchema);
