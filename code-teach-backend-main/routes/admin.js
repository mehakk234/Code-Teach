const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const User = require('../models/User');
const Course = require('../models/Course');
const { cacheMiddleware, invalidateCache } = require('../middleware/cache');
const emailQueue = require('../utils/emailQueue');

// Get dashboard stats - with caching
router.get('/stats', adminAuth, cacheMiddleware(300), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCourses = await Course.countDocuments();
    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5);
    const recentCourses = await Course.find().sort({ createdAt: -1 }).limit(5);
    
    // Get email queue stats
    const queueStats = await emailQueue.getStats();

    res.json({
      stats: {
        totalUsers,
        totalCourses
      },
      recentUsers,
      recentCourses,
      queueStats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all users - with caching
router.get('/users', adminAuth, cacheMiddleware(60), async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 }); // Sort by newest first
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all courses with detailed info - with caching
router.get('/courses', adminAuth, cacheMiddleware(300), async (req, res) => {
  try {
    const courses = await Course.find().populate('enrolledUsers', 'username email');
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new course
router.post('/courses', adminAuth, async (req, res) => {
  try {
    const course = await Course.create(req.body);
    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update course
router.put('/courses/:id', adminAuth, async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(course);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete course
router.delete('/courses/:id', adminAuth, async (req, res) => {
  try {
    await Course.findByIdAndDelete(req.params.id);
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user enrollments
router.get('/enrollments', adminAuth, async (req, res) => {
  try {
    const courses = await Course.find().populate('enrolledUsers', 'username email');
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user
router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Don't allow deleting admin users
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (user.email === process.env.ADMIN_EMAIL) {
      return res.status(403).json({ error: 'Cannot delete admin user' });
    }

    await User.findByIdAndDelete(userId);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
