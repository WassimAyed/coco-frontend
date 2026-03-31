import { AuthSession } from './user.model';

export interface RegisterPayload {
  email: string;
  username: string;
  lastname: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export interface VerifyEmailPayload {
  email: string;
  token: string;
}

export interface VerifyTwoFactorPayload {
  email: string;
  code: string;
}

export interface ResendVerificationCodePayload {
  email: string;
}

export interface LoginResult {
  message?: string;
  requiresTwoFactor?: boolean;
  session?: AuthSession;
  twoFactorEmail?: string;
}

export interface MessageResponse {
  message?: string;
  status?: string;
}

export interface RegisterResult extends MessageResponse {}
