import { http, HttpResponse } from 'msw';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const handlers = [
  // Auth endpoints
  http.post(`${API_BASE_URL}/auth/signup`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      message: 'Verification code sent to email',
      email: body.email,
      sessionId: 'mock-session-id'
    });
  }),

  http.post(`${API_BASE_URL}/auth/verify-email`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      message: 'Email verified successfully',
      token: 'mock-jwt-token',
      user: {
        id: 'user-123',
        email: body.email,
        username: 'testuser'
      }
    });
  }),

  http.post(`${API_BASE_URL}/auth/signin`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      token: 'mock-jwt-token',
      user: {
        id: 'user-123',
        email: body.email,
        username: 'testuser',
        isAdmin: false
      },
      redirectTo: '/learning-dashboard'
    });
  }),

  http.post(`${API_BASE_URL}/auth/forgot-password`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      message: 'Password reset code sent to your email',
      email: body.email
    });
  }),

  // Courses endpoints
  http.get(`${API_BASE_URL}/api/courses`, () => {
    return HttpResponse.json([
      {
        _id: 'course-1',
        title: 'JavaScript Basics',
        description: 'Learn JavaScript fundamentals',
        difficulty: 'Beginner',
        duration: '4 weeks',
        category: 'Programming'
      },
      {
        _id: 'course-2',
        title: 'React Advanced',
        description: 'Master React development',
        difficulty: 'Advanced',
        duration: '6 weeks',
        category: 'Web Development'
      }
    ]);
  }),

  http.get(`${API_BASE_URL}/api/courses/enrolled`, () => {
    return HttpResponse.json({
      courses: [
        {
          _id: 'course-1',
          title: 'JavaScript Basics',
          description: 'Learn JavaScript fundamentals',
          difficulty: 'Beginner',
          progress: 45,
          enrolledAt: new Date().toISOString()
        }
      ],
      count: 1
    });
  }),

  http.post(`${API_BASE_URL}/api/courses/enroll/:courseId`, ({ params }) => {
    return HttpResponse.json({
      message: 'Successfully enrolled in course',
      token: 'mock-jwt-token',
      user: {
        id: 'user-123',
        enrolledCourses: [{ courseId: params.courseId, progress: 0 }]
      }
    });
  }),

  http.put(`${API_BASE_URL}/api/courses/progress/:courseId`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      message: 'Progress updated successfully',
      progress: 50,
      completedModules: 1,
      totalModules: 2
    });
  }),

  http.get(`${API_BASE_URL}/api/courses/progress/:courseId`, () => {
    return HttpResponse.json({
      completedModules: ['1.1', '1.2'],
      progress: 50,
      lastVisited: {
        moduleId: '1',
        subModuleId: '2',
        timestamp: new Date().toISOString()
      },
      totalModules: 4
    });
  }),

  // Error handlers for testing error states
  http.post(`${API_BASE_URL}/auth/signin-error`, () => {
    return HttpResponse.json(
      { error: 'Invalid email or password' },
      { status: 401 }
    );
  }),

  http.get(`${API_BASE_URL}/api/courses-error`, () => {
    return HttpResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  })
];
