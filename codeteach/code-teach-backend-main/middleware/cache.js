const redisClient = require('../utils/redisClient');

/**
 * Cache Middleware - Implements caching layer using Redis
 * Caches GET requests to reduce database load and improve response times
 */
const cacheMiddleware = (ttl = 3600) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    try {
      // Generate cache key based on URL and query parameters
      const cacheKey = `cache:${req.originalUrl || req.url}`;
      
      // Try to get cached data
      const cachedData = await redisClient.get(cacheKey);
      
      if (cachedData) {
        console.log(`✅ Cache HIT: ${cacheKey}`);
        return res.json(cachedData);
      }

      console.log(`❌ Cache MISS: ${cacheKey}`);

      // Store original res.json function
      const originalJson = res.json.bind(res);

      // Override res.json to cache the response
      res.json = (data) => {
        // Cache the response
        redisClient.set(cacheKey, data, ttl).catch(err => {
          console.error('Cache set error:', err.message);
        });

        // Call original json function
        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error.message);
      // Continue without caching on error
      next();
    }
  };
};

/**
 * Invalidate cache for specific patterns
 */
const invalidateCache = async (pattern) => {
  try {
    const deleted = await redisClient.delPattern(`cache:${pattern}`);
    console.log(`🗑️  Invalidated ${deleted} cache entries matching: ${pattern}`);
    return deleted;
  } catch (error) {
    console.error('Cache invalidation error:', error.message);
    return 0;
  }
};

/**
 * Invalidate all course-related caches
 */
const invalidateCoursesCache = async () => {
  await invalidateCache('*/api/courses*');
};

/**
 * Invalidate user-specific caches
 */
const invalidateUserCache = async (userId) => {
  await invalidateCache(`*/api/users/${userId}*`);
  await invalidateCache('*/api/courses/enrolled*');
};

module.exports = {
  cacheMiddleware,
  invalidateCache,
  invalidateCoursesCache,
  invalidateUserCache
};
