export const environment = {
  googleMapsApiKey: 'AIzaSyBIaXbRrGVgkj8Ffre1-dHYRrEokUrp-w0',
  apiBaseUrl: 'http://localhost:8090/',
  collocationApiBaseUrl: 'http://localhost:9092/collocationservice/collocation',
  paymentApiBaseUrl: 'http://localhost:9092/api/payment',
  lostFoundApiBaseUrl: 'http://localhost:9092/api/lost-found',
  eventApiBaseUrl: 'http://localhost:9092/api/event/api/events',
  eventServiceUrl: 'http://localhost:9092/api/event',
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
