import { AuthSession } from './user.model';

describe('AuthSession model', () => {
  it('should describe an authenticated user session', () => {
    const session: AuthSession = {
      authenticatedAt: '2026-03-20T10:00:00.000Z',
      rememberMe: true,
      user: {
        academicLevel: '4th year',
        avatarUrl: 'data:image/svg+xml;base64,avatar',
        bio: 'Student profile',
        campus: 'ESPRIT Ariana',
        department: 'Software Engineering',
        email: 'student@esprit.tn',
        firstName: 'Student',
        highlights: ['Verified student access'],
        id: 'student-session',
        lastName: 'Demo',
        role: 'admin',
        stats: [
          {
            label: 'Rides shared',
            value: '12'
          }
        ]
      }
    };

    expect(session.user.email).toBe('student@esprit.tn');
  });
});
