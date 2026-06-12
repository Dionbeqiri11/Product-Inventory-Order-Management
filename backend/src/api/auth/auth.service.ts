import { AppError } from '../../utils/AppError';
import { UserModel, hashPassword, verifyPassword, type UserDocument } from './user.model';
import { signToken } from './token';
import type { LoginInput, RegisterInput } from './auth.schemas';

export interface AuthResult {
  token: string;
  user: UserDocument;
}

export const authService = {
  async register(input: RegisterInput): Promise<AuthResult> {
    const existing = await UserModel.findOne({ email: input.email }).exec();
    if (existing) throw AppError.conflict('Email is already registered');

    const passwordHash = await hashPassword(input.password);
    const user = await UserModel.create({
      name: input.name,
      email: input.email,
      passwordHash,
    });

    return { token: signToken({ sub: String(user._id), email: user.email }), user };
  },

  async login(input: LoginInput): Promise<AuthResult> {
    // passwordHash is select:false, so request it explicitly here.
    const user = await UserModel.findOne({ email: input.email }).select('+passwordHash').exec();
    if (!user) throw AppError.unauthorized('Invalid email or password');

    const ok = await verifyPassword(input.password, String(user.passwordHash));
    if (!ok) throw AppError.unauthorized('Invalid email or password');

    return { token: signToken({ sub: String(user._id), email: user.email }), user };
  },
};
