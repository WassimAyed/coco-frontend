export const environment = {
  apiBaseUrl: 'http://localhost:8090/',
  eventApiBaseUrl: 'http://localhost:8093/api/events',
  eventServiceUrl: 'http://localhost:8093',
  auth: {
    loginPath: '/auth/login',
    registerPath: '/auth/register',
    verifyEmailPath: '/auth/verify-email',
    resendVerificationCodePath: '/auth/resend-verification-code',
    verifyTwoFactorPath: '/auth/verify-2fa',
    resendTwoFactorCodePath: '/auth/resend-2fa-code',
    googleLoginPath: '/oauth2/authorization/google',
    withCredentials: true
  },
  storage: {
    profileImageUploadUrl: '',
    profileImageFormFieldName: 'file',
    withCredentials: true
  }
};
