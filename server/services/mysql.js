/**
 * MySQL 服务
 * 存储聚合后的错误 Issue 和 Session 信息
 */

const mysql = require('mysql2/promise');

// 创建连接池
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  port: process.env.MYSQL_PORT || 3306,
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'password',
  database: process.env.MYSQL_DATABASE || 'monitor_platform',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/**
 * 保存错误到 MySQL
 */
async function saveErrorToMySQL(errorData) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 保存错误记录
    const [result] = await connection.execute(
      `INSERT INTO error_logs (
        error_id, session_id, user_id, type, sub_type,
        message, stack, stack_hash, url, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        errorData.errorId,
        errorData.session?.sessionId,
        errorData.session?.userId,
        errorData.type,
        errorData.subType,
        errorData.message,
        errorData.stack,
        errorData.stackHash,
        errorData.pageState?.url,
        new Date(errorData.timestamp),
      ]
    );

    await connection.commit();
    console.log(`[MySQL] Saved error: ${errorData.errorId}`);

    return result;
  } catch (error) {
    await connection.rollback();
    console.error('[MySQL] Save error failed:', error);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * 更新或创建错误 Issue（聚合相同错误）
 */
async function updateErrorIssue(errorData) {
  const connection = await pool.getConnection();

  try {
    const { stackHash, message, subType, timestamp } = errorData;

    // 查询是否存在相同的 Issue
    const [existing] = await connection.execute(
      'SELECT * FROM error_issues WHERE stack_hash = ? LIMIT 1',
      [stackHash]
    );

    if (existing.length > 0) {
      // 更新现有 Issue
      const issue = existing[0];

      await connection.execute(
        `UPDATE error_issues SET
          last_seen_at = ?,
          occurrence_count = occurrence_count + 1,
          affected_users = (
            SELECT COUNT(DISTINCT user_id)
            FROM error_logs
            WHERE stack_hash = ?
          )
        WHERE id = ?`,
        [new Date(timestamp), stackHash, issue.id]
      );

      console.log(`[MySQL] Updated issue: ${issue.issue_id}`);
    } else {
      // 创建新 Issue
      const issueId = `issue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      await connection.execute(
        `INSERT INTO error_issues (
          issue_id, error_type, error_message, stack_hash,
          first_seen_at, last_seen_at, occurrence_count, affected_users, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          issueId,
          subType,
          message,
          stackHash,
          new Date(timestamp),
          new Date(timestamp),
          1,
          1,
          'open',
        ]
      );

      console.log(`[MySQL] Created new issue: ${issueId}`);
    }
  } catch (error) {
    console.error('[MySQL] Update issue failed:', error);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * 保存 Session 到 MySQL
 */
async function saveSessionToMySQL(sessionData) {
  const connection = await pool.getConnection();

  try {
    await connection.execute(
      `INSERT INTO user_sessions (
        session_id, user_id, start_time, end_time, duration,
        page_views, error_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        end_time = VALUES(end_time),
        duration = VALUES(duration),
        page_views = VALUES(page_views),
        error_count = VALUES(error_count)`,
      [
        sessionData.sessionId,
        sessionData.userId,
        new Date(sessionData.sessionStartTime),
        new Date(sessionData.timestamp),
        sessionData.sessionDuration,
        sessionData.pageViewCount,
        sessionData.errorCount,
      ]
    );

    console.log(`[MySQL] Saved session: ${sessionData.sessionId}`);
  } catch (error) {
    console.error('[MySQL] Save session failed:', error);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * 获取错误列表
 */
async function getErrorsFromMySQL(query) {
  const connection = await pool.getConnection();

  try {
    const { page = 1, pageSize = 20, status, type } = query;
    const offset = (page - 1) * pageSize;

    let whereClause = [];
    let params = [];

    if (status) {
      whereClause.push('status = ?');
      params.push(status);
    }

    if (type) {
      whereClause.push('error_type = ?');
      params.push(type);
    }

    const where = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : '';

    // 查询总数
    const [countResult] = await connection.execute(
      `SELECT COUNT(*) as total FROM error_issues ${where}`,
      params
    );

    // 查询列表
    const [rows] = await connection.execute(
      `SELECT * FROM error_issues ${where}
       ORDER BY last_seen_at DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    return {
      total: countResult[0].total,
      list: rows,
    };
  } catch (error) {
    console.error('[MySQL] Get errors failed:', error);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * 获取错误详情
 */
async function getErrorDetailFromMySQL(issueId) {
  const connection = await pool.getConnection();

  try {
    const [rows] = await connection.execute(
      'SELECT * FROM error_issues WHERE issue_id = ? LIMIT 1',
      [issueId]
    );

    if (rows.length > 0) {
      return rows[0];
    }

    return null;
  } catch (error) {
    console.error('[MySQL] Get error detail failed:', error);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * 更新错误状态
 */
async function updateErrorStatus(issueId, status) {
  const connection = await pool.getConnection();

  try {
    await connection.execute(
      'UPDATE error_issues SET status = ? WHERE issue_id = ?',
      [status, issueId]
    );

    console.log(`[MySQL] Updated error status: ${issueId} -> ${status}`);
  } catch (error) {
    console.error('[MySQL] Update error status failed:', error);
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  saveErrorToMySQL,
  updateErrorIssue,
  saveSessionToMySQL,
  getErrorsFromMySQL,
  getErrorDetailFromMySQL,
  updateErrorStatus,
};
