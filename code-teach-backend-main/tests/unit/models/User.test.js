const User = require('../../../models/User');
const Course = require('../../../models/Course');
const { createTestUser, createTestCourse } = require('../../helpers/testHelpers');

describe('User Model', () => {
  describe('User Creation', () => {
    it('should create a new user with valid data', async () => {
      const userData = {
        username: 'johndoe',
        email: 'john@example.com',
        password: 'password123'
      };

      const user = await User.create(userData);

      expect(user).toBeDefined();
      expect(user.username).toBe('johndoe');
      expect(user.email).toBe('john@example.com');
      expect(user.password).not.toBe('password123'); // Password should be hashed
      expect(user.enrolledCourses).toEqual([]);
    });

    it('should hash password before saving', async () => {
      const user = await createTestUser({ password: 'plaintext123' });
      
      expect(user.password).not.toBe('plaintext123');
      expect(user.password).toMatch(/^\$2[aby]\$.{56}$/); // bcrypt hash pattern
    });

    it('should fail to create user without required fields', async () => {
      const invalidUser = new User({
        email: 'test@example.com'
        // Missing username and password
      });

      await expect(invalidUser.save()).rejects.toThrow();
    });

    it('should fail to create user with invalid email', async () => {
      const invalidUser = new User({
        username: 'testuser',
        email: 'invalid-email',
        password: 'password123'
      });

      await expect(invalidUser.save()).rejects.toThrow();
    });

    it('should fail to create user with duplicate email', async () => {
      await createTestUser({ email: 'duplicate@example.com' });

      await expect(
        createTestUser({ email: 'duplicate@example.com', username: 'different' })
      ).rejects.toThrow();
    });

    it('should fail to create user with short password', async () => {
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: '12345' // Too short
      });

      await expect(user.save()).rejects.toThrow();
    });

    it('should fail to create user with invalid username', async () => {
      const user = new User({
        username: 'ab', // Too short
        email: 'test@example.com',
        password: 'password123'
      });

      await expect(user.save()).rejects.toThrow();
    });
  });

  describe('Password Methods', () => {
    it('should correctly compare passwords', async () => {
      const password = 'testpassword123';
      const user = await createTestUser({ password });

      const isMatch = await user.comparePassword(password);
      expect(isMatch).toBe(true);
    });

    it('should reject incorrect passwords', async () => {
      const user = await createTestUser({ password: 'correctpassword' });

      const isMatch = await user.comparePassword('wrongpassword');
      expect(isMatch).toBe(false);
    });
  });

  describe('Course Enrollment', () => {
    it('should enroll user in a course', async () => {
      const user = await createTestUser();
      const course = await createTestCourse();

      await user.enrollInCourse(course._id);

      expect(user.enrolledCourses).toHaveLength(1);
      expect(user.enrolledCourses[0].course.toString()).toBe(course._id.toString());
      expect(user.enrolledCourses[0].progress).toBe(0);
    });

    it('should fail to enroll in non-existent course', async () => {
      const user = await createTestUser();
      const fakeId = '507f1f77bcf86cd799439011';

      await expect(user.enrollInCourse(fakeId)).rejects.toThrow('Course not found');
    });

    it('should fail to enroll in same course twice', async () => {
      const user = await createTestUser();
      const course = await createTestCourse();

      await user.enrollInCourse(course._id);
      
      await expect(user.enrollInCourse(course._id)).rejects.toThrow('Already enrolled');
    });

    it('should fail to enroll with invalid course ID', async () => {
      const user = await createTestUser();

      await expect(user.enrollInCourse('invalid-id')).rejects.toThrow('Invalid course ID');
    });
  });

  describe('Module Progress Tracking', () => {
    it('should update module progress correctly', async () => {
      const user = await createTestUser();
      const course = await createTestCourse();
      
      await user.enrollInCourse(course._id);
      const enrollment = user.enrolledCourses[0];
      
      // Initialize module tracking with proper modules array
      const modules = [
        { id: '1', subModules: [{ id: '1' }, { id: '2' }] },
        { id: '2', subModules: [{ id: '1' }] }
      ];
      enrollment.initializeModuleTracking(modules);
      expect(enrollment.totalModules).toBe(3); // 2 + 1 from test course
      
      // Update progress for first module
      await enrollment.updateModuleProgress('1', '1');
      
      expect(enrollment.completedModules).toBe(1);
      expect(enrollment.progress).toBe(Math.round((1 / 3) * 100));
      
      const moduleProgress = enrollment.moduleProgress.find(
        p => p.moduleId === '1' && p.subModuleId === '1'
      );
      expect(moduleProgress.completed).toBe(true);
      expect(moduleProgress.completedAt).toBeDefined();
    });

    it('should calculate progress percentage correctly', async () => {
      const user = await createTestUser();
      const course = await createTestCourse();
      
      await user.enrollInCourse(course._id);
      const enrollment = user.enrolledCourses[0];
      
      const modules = [
        { id: '1', subModules: [{ id: '1' }, { id: '2' }] },
        { id: '2', subModules: [{ id: '1' }] }
      ];
      enrollment.initializeModuleTracking(modules);
      
      // Complete all modules
      await enrollment.updateModuleProgress('1', '1');
      await enrollment.updateModuleProgress('1', '2');
      await enrollment.updateModuleProgress('2', '1');
      
      expect(enrollment.completedModules).toBe(3);
      expect(enrollment.progress).toBe(100);
    });

    it('should update last accessed time', async () => {
      const user = await createTestUser();
      const course = await createTestCourse();
      
      await user.enrollInCourse(course._id);
      const enrollment = user.enrolledCourses[0];
      
      const originalTime = enrollment.lastAccessed;
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 10));
      
      enrollment.updateLastAccessed();
      
      expect(enrollment.lastAccessed.getTime()).toBeGreaterThan(originalTime.getTime());
    });
  });

  describe('User Methods', () => {
    it('should get enrolled courses correctly', async () => {
      const user = await createTestUser();
      const course1 = await createTestCourse({ title: 'Course 1', path: '/courses/course-1' });
      const course2 = await createTestCourse({ title: 'Course 2', path: '/courses/course-2' });
      
      await user.enrollInCourse(course1._id);
      await user.enrollInCourse(course2._id);
      
      const enrolledCourses = user.getEnrolledCourses();
      
      expect(enrolledCourses).toHaveLength(2);
      expect(enrolledCourses[0].progress).toBe(0);
    });

    it('should cleanup invalid enrollments', async () => {
      const user = await createTestUser();
      const course = await createTestCourse({ path: '/courses/cleanup-test' });
      
      await user.enrollInCourse(course._id);
      
      // Delete the course to make enrollment invalid
      await course.deleteOne();
      
      const cleaned = await user.cleanupEnrollments();
      
      expect(cleaned).toBe(true);
      expect(user.enrolledCourses).toHaveLength(0);
    });
  });

  describe('User Schema Validation', () => {
    it('should validate username format', async () => {
      const invalidUser = new User({
        username: 'invalid user!', // Contains space and special char
        email: 'test@example.com',
        password: 'password123'
      });

      await expect(invalidUser.save()).rejects.toThrow();
    });

    it('should convert email to lowercase', async () => {
      const user = await createTestUser({ email: 'TEST@EXAMPLE.COM' });
      
      expect(user.email).toBe('test@example.com');
    });

    it('should trim whitespace from username and email', async () => {
      const user = await createTestUser({
        username: '  testuser  ',
        email: '  test@example.com  '
      });
      
      expect(user.username).toBe('testuser');
      expect(user.email).toBe('test@example.com');
    });
  });
});
