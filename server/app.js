/**
 * 后端接入层 - Express 服务器
 * 接收前端 SDK 上报的数据，进行处理和存储
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { saveToElasticsearch } = require('./services/elasticsearch');
const { cacheSessionToRedis } = require('./services/redis');
const { saveErrorToMySQL, updateErrorIssue } = require('./services/mysql');
const { validateErrorData, cleanData } = require('./utils/validator');
const { generateStackHash } = require('./utils/hash');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// 请求日志
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

/**
 * 错误上报接口
 * POST /api/error/report
 */
app.post('/api/error/report', async (req, res) => {
  try {
    const errorData = req.body;

    // 1. 数据验证
    const validation = validateErrorData(errorData);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid data',
        details: validation.errors,
      });
    }

    // 2. 数据清洗
    const cleanedData = cleanData(errorData);

    // 3. 生成堆栈哈希（用于错误聚合）
    cleanedData.stackHash = generateStackHash(cleanedData.stack || cleanedData.message);

    // 4. 存储原始日志到 ES（异步）
    saveToElasticsearch(cleanedData).catch(err => {
      console.error('[ES] Save failed:', err);
    });

    // 5. 缓存 Session 信息到 Redis（异步）
    if (cleanedData.session) {
      cacheSessionToRedis(cleanedData.session).catch(err => {
        console.error('[Redis] Cache failed:', err);
      });
    }

    // 6. 保存到 MySQL 并更新 Issue（异步）
    saveErrorToMySQL(cleanedData).catch(err => {
      console.error('[MySQL] Save failed:', err);
    });

    updateErrorIssue(cleanedData).catch(err => {
      console.error('[MySQL] Update issue failed:', err);
    });

    // 7. 立即返回成功响应
    res.status(200).json({
      success: true,
      errorId: cleanedData.errorId,
      timestamp: Date.now(),
    });

    console.log(`[Error Report] Received: ${cleanedData.errorId}`);
  } catch (error) {
    console.error('[Error Report] Failed:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * Session 结束接口
 * POST /api/session/end
 */
app.post('/api/session/end', async (req, res) => {
  try {
    const sessionData = req.body;

    // 保存 Session 数据
    await saveToElasticsearch({
      ...sessionData,
      index: 'sessions',
    });

    res.status(200).json({ success: true });
    console.log(`[Session End] ${sessionData.session?.sessionId}`);
  } catch (error) {
    console.error('[Session End] Failed:', error);
    res.status(500).json({ success: false });
  }
});

/**
 * 获取错误详情
 * GET /api/error/:errorId
 */
app.get('/api/error/:errorId', async (req, res) => {
  try {
    const { errorId } = req.params;

    // 从 ES 查询错误详情
    const errorDetail = await getErrorFromES(errorId);

    if (!errorDetail) {
      return res.status(404).json({
        success: false,
        error: 'Error not found',
      });
    }

    res.json({
      success: true,
      data: errorDetail,
    });
  } catch (error) {
    console.error('[Get Error] Failed:', error);
    res.status(500).json({ success: false });
  }
});

/**
 * 获取错误列表
 * GET /api/errors
 */
app.get('/api/errors', async (req, res) => {
  try {
    const { page = 1, pageSize = 20, status, type } = req.query;

    // 从 MySQL 查询错误列表
    const errors = await getErrorsFromMySQL({
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      status,
      type,
    });

    res.json({
      success: true,
      data: errors.list,
      total: errors.total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    });
  } catch (error) {
    console.error('[Get Errors] Failed:', error);
    res.status(500).json({ success: false });
  }
});

/**
 * 获取 Session 详情
 * GET /api/session/:sessionId
 */
app.get('/api/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    // 先从 Redis 查询
    let sessionData = await getSessionFromRedis(sessionId);

    // 如果 Redis 没有，从 ES 查询
    if (!sessionData) {
      sessionData = await getSessionFromES(sessionId);
    }

    if (!sessionData) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
      });
    }

    res.json({
      success: true,
      data: sessionData,
    });
  } catch (error) {
    console.error('[Get Session] Failed:', error);
    res.status(500).json({ success: false });
  }
});

/**
 * 健康检查
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('[Server Error]:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`[Server] Running on port ${PORT}`);
  console.log(`[Server] Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
