-- 监控平台数据库表结构
-- 数据库名称: monitor_platform

CREATE DATABASE IF NOT EXISTS monitor_platform DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE monitor_platform;

-- ============================================
-- 1. 错误日志表（原始错误记录）
-- ============================================
CREATE TABLE IF NOT EXISTS error_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
  error_id VARCHAR(64) NOT NULL COMMENT '错误ID',
  session_id VARCHAR(64) NOT NULL COMMENT 'Session ID',
  user_id VARCHAR(64) NOT NULL COMMENT '用户ID',
  type VARCHAR(32) NOT NULL COMMENT '错误类型：error',
  sub_type VARCHAR(32) NOT NULL COMMENT '错误子类型：js/resource/promise/vue/react',
  message TEXT COMMENT '错误信息',
  stack TEXT COMMENT '错误堆栈',
  stack_hash VARCHAR(64) COMMENT '堆栈哈希（用于聚合）',
  url VARCHAR(512) COMMENT '错误发生的页面URL',
  timestamp DATETIME NOT NULL COMMENT '错误发生时间',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

  INDEX idx_error_id (error_id),
  INDEX idx_session_id (session_id),
  INDEX idx_user_id (user_id),
  INDEX idx_stack_hash (stack_hash),
  INDEX idx_timestamp (timestamp),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='错误日志表';

-- ============================================
-- 2. 错误 Issue 表（聚合后的错误）
-- ============================================
CREATE TABLE IF NOT EXISTS error_issues (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
  issue_id VARCHAR(64) UNIQUE NOT NULL COMMENT 'Issue ID',
  error_type VARCHAR(32) NOT NULL COMMENT '错误类型',
  error_message TEXT COMMENT '错误信息',
  stack_hash VARCHAR(64) UNIQUE NOT NULL COMMENT '堆栈哈希（用于聚合相同错误）',
  first_seen_at DATETIME NOT NULL COMMENT '首次发生时间',
  last_seen_at DATETIME NOT NULL COMMENT '最近发生时间',
  occurrence_count INT DEFAULT 1 COMMENT '发生次数',
  affected_users INT DEFAULT 1 COMMENT '影响用户数',
  status ENUM('open', 'resolved', 'ignored') DEFAULT 'open' COMMENT '状态：open-未解决/resolved-已解决/ignored-已忽略',
  assigned_to VARCHAR(64) COMMENT '分配给谁处理',
  priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium' COMMENT '优先级',
  tags JSON COMMENT '标签',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  INDEX idx_issue_id (issue_id),
  INDEX idx_stack_hash (stack_hash),
  INDEX idx_status (status),
  INDEX idx_last_seen (last_seen_at),
  INDEX idx_occurrence_count (occurrence_count),
  INDEX idx_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='错误Issue表（聚合）';

-- ============================================
-- 3. 用户 Session 表
-- ============================================
CREATE TABLE IF NOT EXISTS user_sessions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
  session_id VARCHAR(64) UNIQUE NOT NULL COMMENT 'Session ID',
  user_id VARCHAR(64) NOT NULL COMMENT '用户ID',
  start_time DATETIME NOT NULL COMMENT 'Session 开始时间',
  end_time DATETIME COMMENT 'Session 结束时间',
  duration INT COMMENT 'Session 时长（毫秒）',
  page_views INT DEFAULT 0 COMMENT '页面浏览次数',
  error_count INT DEFAULT 0 COMMENT '错误次数',
  device_info JSON COMMENT '设备信息',
  user_agent TEXT COMMENT 'User Agent',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  INDEX idx_session_id (session_id),
  INDEX idx_user_id (user_id),
  INDEX idx_start_time (start_time),
  INDEX idx_error_count (error_count)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户Session表';

-- ============================================
-- 4. 行为链路表（Breadcrumb）
-- ============================================
CREATE TABLE IF NOT EXISTS session_breadcrumbs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
  session_id VARCHAR(64) NOT NULL COMMENT 'Session ID',
  sequence INT NOT NULL COMMENT '序号',
  type VARCHAR(32) NOT NULL COMMENT '类型：navigation/user/http/console/error',
  category VARCHAR(32) NOT NULL COMMENT '分类：pageview/click/ajax/log等',
  message TEXT COMMENT '描述信息',
  data JSON COMMENT '附加数据',
  timestamp BIGINT NOT NULL COMMENT '时间戳',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

  INDEX idx_session_id (session_id),
  INDEX idx_timestamp (timestamp),
  INDEX idx_type (type),
  INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='行为链路表';

-- ============================================
-- 5. 用户表
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
  user_id VARCHAR(64) UNIQUE NOT NULL COMMENT '用户ID',
  username VARCHAR(128) COMMENT '用户名',
  email VARCHAR(256) COMMENT '邮箱',
  phone VARCHAR(32) COMMENT '手机号',
  avatar VARCHAR(512) COMMENT '头像',
  extra_info JSON COMMENT '额外信息',
  first_seen_at DATETIME NOT NULL COMMENT '首次访问时间',
  last_seen_at DATETIME NOT NULL COMMENT '最近访问时间',
  total_sessions INT DEFAULT 0 COMMENT '总Session数',
  total_errors INT DEFAULT 0 COMMENT '总错误数',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  INDEX idx_user_id (user_id),
  INDEX idx_email (email),
  INDEX idx_last_seen (last_seen_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- ============================================
-- 6. 错误评论表
-- ============================================
CREATE TABLE IF NOT EXISTS error_comments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
  issue_id VARCHAR(64) NOT NULL COMMENT 'Issue ID',
  user_id VARCHAR(64) NOT NULL COMMENT '评论用户ID',
  content TEXT NOT NULL COMMENT '评论内容',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

  INDEX idx_issue_id (issue_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='错误评论表';

-- ============================================
-- 7. 错误处理记录表
-- ============================================
CREATE TABLE IF NOT EXISTS error_activities (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
  issue_id VARCHAR(64) NOT NULL COMMENT 'Issue ID',
  user_id VARCHAR(64) NOT NULL COMMENT '操作用户ID',
  action VARCHAR(32) NOT NULL COMMENT '操作类型：assign/resolve/reopen/ignore',
  old_value VARCHAR(256) COMMENT '旧值',
  new_value VARCHAR(256) COMMENT '新值',
  comment TEXT COMMENT '备注',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

  INDEX idx_issue_id (issue_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='错误处理记录表';

-- ============================================
-- 8. 性能监控表
-- ============================================
CREATE TABLE IF NOT EXISTS performance_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
  session_id VARCHAR(64) NOT NULL COMMENT 'Session ID',
  user_id VARCHAR(64) NOT NULL COMMENT '用户ID',
  type VARCHAR(32) NOT NULL COMMENT '类型：load/fcp/lcp/xhr/fetch',
  url VARCHAR(512) COMMENT 'URL',
  duration INT COMMENT '耗时（毫秒）',
  metrics JSON COMMENT '性能指标',
  timestamp DATETIME NOT NULL COMMENT '时间戳',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

  INDEX idx_session_id (session_id),
  INDEX idx_type (type),
  INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='性能监控表';

-- ============================================
-- 9. 项目配置表
-- ============================================
CREATE TABLE IF NOT EXISTS projects (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
  project_id VARCHAR(64) UNIQUE NOT NULL COMMENT '项目ID',
  project_name VARCHAR(128) NOT NULL COMMENT '项目名称',
  project_key VARCHAR(64) UNIQUE NOT NULL COMMENT '项目Key（用于SDK配置）',
  description TEXT COMMENT '项目描述',
  status ENUM('active', 'inactive') DEFAULT 'active' COMMENT '状态',
  config JSON COMMENT '配置信息',
  created_by VARCHAR(64) COMMENT '创建人',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  INDEX idx_project_id (project_id),
  INDEX idx_project_key (project_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='项目配置表';

-- ============================================
-- 插入测试数据
-- ============================================

-- 插入测试项目
INSERT INTO projects (project_id, project_name, project_key, description, created_by)
VALUES ('proj-001', '测试项目', 'test-project', '这是一个测试项目', 'admin');

-- 插入测试用户
INSERT INTO users (user_id, username, email, first_seen_at, last_seen_at)
VALUES
  ('user-001', '张三', 'zhangsan@example.com', NOW(), NOW()),
  ('user-002', '李四', 'lisi@example.com', NOW(), NOW());

-- ============================================
-- 创建视图：错误统计
-- ============================================
CREATE OR REPLACE VIEW error_stats AS
SELECT
  DATE(timestamp) as date,
  sub_type,
  COUNT(*) as error_count,
  COUNT(DISTINCT user_id) as affected_users,
  COUNT(DISTINCT session_id) as affected_sessions
FROM error_logs
GROUP BY DATE(timestamp), sub_type;

-- ============================================
-- 创建视图：用户错误统计
-- ============================================
CREATE OR REPLACE VIEW user_error_stats AS
SELECT
  user_id,
  COUNT(*) as total_errors,
  COUNT(DISTINCT session_id) as total_sessions,
  MIN(timestamp) as first_error_at,
  MAX(timestamp) as last_error_at
FROM error_logs
GROUP BY user_id;

-- ============================================
-- 创建存储过程：清理过期数据
-- ============================================
DELIMITER //

CREATE PROCEDURE clean_old_data(IN days INT)
BEGIN
  DECLARE cutoff_date DATETIME;
  SET cutoff_date = DATE_SUB(NOW(), INTERVAL days DAY);

  -- 删除过期的错误日志
  DELETE FROM error_logs WHERE created_at < cutoff_date;

  -- 删除过期的行为链路
  DELETE FROM session_breadcrumbs WHERE created_at < cutoff_date;

  -- 删除过期的性能日志
  DELETE FROM performance_logs WHERE created_at < cutoff_date;

  SELECT CONCAT('Cleaned data older than ', days, ' days') as result;
END //

DELIMITER ;

-- ============================================
-- 创建定时任务（需要开启 Event Scheduler）
-- ============================================
-- SET GLOBAL event_scheduler = ON;

-- 每天凌晨2点清理90天前的数据
-- CREATE EVENT IF NOT EXISTS clean_old_data_event
-- ON SCHEDULE EVERY 1 DAY
-- STARTS TIMESTAMP(CURRENT_DATE, '02:00:00')
-- DO CALL clean_old_data(90);
