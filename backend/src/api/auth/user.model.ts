import { Schema, model, type HydratedDocument } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser {
  email: string;
  passwordHash: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    // Stored as a bcrypt hash; never selected by default to avoid leaking it.
    passwordHash: { type: String, required: true, select: false },
    name: { type: String, required: true, trim: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_doc, ret) => {
        const { _id, passwordHash, ...rest } = ret as Record<string, unknown>;
        void passwordHash;
        return { id: _id, ...rest };
      },
    },
  },
);

export type UserDocument = HydratedDocument<IUser>;

const SALT_ROUNDS = 10;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export const UserModel = model<IUser>('User', userSchema);
