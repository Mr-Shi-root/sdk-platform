/**
 * Redis 服务
 * 缓存 Session 信息，提供快速查询
 */

const redis = require('redis');

// 创建 Redis 客户端
const client = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
});

client.on('error', (err) => {
  console.error('[Redis] Error:', err);
});

client.on('connect', () => {
  console.log('[Redis] Connected');
});

// 连接 Redis
client.connect().catch(console.error);

/**
 * 缓存 Session 信息到 Redis
 */
async function cacheSessionToRedis(sessionData) {
  try {
    const key = `session:${sessionData.sessionId}`;
    const value = JSON.stringify(sessionData);

    // 设置过期时间为 30 分钟
    await client.setEx(key, 30 * 60, value);

    console.log(`[Redis] Cached session: ${sessionData.sessionId}`);
  } catch (error) {
    console.error('[Redis] Cache session failed:', error);
    throw error;
  }
}

/**
 * 从 Redis 获取 Session 信息
 */
async function getSessionFromRedis(sessionId) {
  try {
    const key = `session:${sessionId}`;
    const value = await client.get(key);

    if (value) {
      return JSON.parse(value);
    }

    return null;
  } catch (error) {
    console.error('[Redis] Get session failed:', error);
    throw error;
  }
}

/**
 * 更新 Session 信息
 */
async function updateSessionInRedis(sessionId, updates) {
  try {
    const key = `session:${sessionId}`;
    const existing = await getSessionFromRedis(sessionId);

    if (existing) {
      const updated = { ...existing, ...updates };
      await client.setEx(key, 30 * 60, JSON.stringify(updated));
      console.log(`[Redis] Updated session: ${sessionId}`);
    }
  } catch (error) {
    console.error('[Redis] Update session failed:', error);
    throw error;
  }
}

/**
 * 删除 Session
 */
async function deleteSessionFromRedis(sessionId) {
  try {
    const key = `session:${sessionId}`;
    await client.del(key);
    console.log(`[Redis] Deleted session: ${sessionId}`);
  } catch (error) {
    console.error('[Redis] Delete session failed:', error);
    throw error;
  }
}

/**
 * 缓存错误统计信息
 */
async function cacheErrorStats(errorId, stats) {
  try {
    const key = `error:stats:${errorId}`;
    await client.setEx(key, 60 * 60, JSON.stringify(stats)); // 1小时过期
    console.log(`[Redis] Cached error stats: ${errorId}`);
  } catch (error) {
    console.error('[Redis] Cache error stats failed:', error);
    throw error;
  }
}

/**
 * 获取错误统计信息
 */
async function getErrorStats(errorId) {
  try {
    const key = `error:stats:${errorId}`;
    const value = await client.get(key);

    if (value) {
      return JSON.parse(value);
    }

    return null;
  } catch (error) {
    console.error('[Redis] Get error stats failed:', error);
    throw error;
  }
}

module.exports = {
  cacheSessionToRedis,
  getSessionFromRedis,
  updateSessionInRedis,
  deleteSessionFromRedis,
  cacheErrorStats,
  getErrorStats,
};
