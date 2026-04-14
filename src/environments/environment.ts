export const environment = {
  apiBaseUrl: 'http://localhost:8090/',
  collocationApiBaseUrl: 'http://localhost:9092/collocationservice/collocation',
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
