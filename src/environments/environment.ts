export const environment = {
  googleMapsApiKey: 'AIzaSyBIaXbRrGVgkj8Ffre1-dHYRrEokUrp-w0',
  apiBaseUrl: 'http://localhost:8090/',
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
