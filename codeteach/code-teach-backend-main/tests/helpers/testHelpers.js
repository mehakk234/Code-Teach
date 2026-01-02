const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const Course = require('../../models/Course');

/**
 * Generate a valid JWT token for testing
 */
const generateAuthToken = (userId, isAdmin = false) => {
  return jwt.sign(
    { userId, isAdmin },
    process.env.JWT_SECRET || 'test-secret-key',
    { expiresIn: '24h' }
  );
};

/**
 * Create a test user
 */
const createTestUser = async (userData = {}) => {
  const defaultUser = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
    isEmailVerified: true,
    ...userData
  };

  const user = await User.create(defaultUser);
  return user;
};

/**
 * Create a test course
 */
const createTestCourse = async (courseData = {}) => {
  const defaultCourse = {
    title: 'Test Course',
    description: 'A test course for testing purposes',
    difficulty: 'Beginner',
    duration: '4 weeks',
    category: 'Programming',
    path: '/courses/test-course',
    modules: [
      {
        id: 1,
        title: 'Module 1',
        subModules: [
          { id: 1, title: 'Submodule 1.1' },
          { id: 2, title: 'Submodule 1.2' }
        ]
      },
      {
        id: 2,
        title: 'Module 2',
        subModules: [
          { id: 1, title: 'Submodule 2.1' }
        ]
      }
    ],
    ...courseData
  };

  const course = await Course.create(defaultCourse);
  return course;
};

/**
 * Create multiple test courses
 */
const createTestCourses = async (count = 3) => {
  const courses = [];
  for (let i = 1; i <= count; i++) {
    const course = await createTestCourse({
      title: `Test Course ${i}`,
      path: `/courses/test-course-${i}`,
      difficulty: i % 3 === 0 ? 'Advanced' : i % 2 === 0 ? 'Intermediate' : 'Beginner'
    });
    courses.push(course);
  }
  return courses;
};

/**
 * Enroll a user in a course
 */
const enrollUserInCourse = async (userId, courseId) => {
  const user = await User.findById(userId);
  await user.enrollInCourse(courseId);
  return user;
};

/**
 * Generate a mock OTP
 */
const generateMockOTP = () => {
  return '123456';
};

/**
 * Wait for a specified time (for async operations)
 */
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

module.exports = {
  generateAuthToken,
  createTestUser,
  createTestCourse,
  createTestCourses,
  enrollUserInCourse,
  generateMockOTP,
  wait
};
