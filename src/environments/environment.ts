export const environment = {
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
    profileImageUploadUrl: '/users/me/profile-image',
    profileImageFormFieldName: 'image',
    withCredentials: true
  },
  studentServices: {
    apiBaseUrl: 'http://localhost:8095',
    basePath: '/student-services',
    websocketPath: '/ws-student-services',
    withCredentials: false
  }
};
