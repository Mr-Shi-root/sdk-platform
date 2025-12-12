/**
 * 数据验证和清洗工具
 */

/**
 * 验证错误数据
 */
function validateErrorData(data) {
  const errors = [];

  // 必填字段验证
  if (!data.type) {
    errors.push('Missing required field: type');
  }

  if (!data.subType) {
    errors.push('Missing required field: subType');
  }

  if (!data.message && !data.stack) {
    errors.push('Missing error message or stack');
  }

  if (!data.timestamp) {
    errors.push('Missing required field: timestamp');
  }

  // Session 验证
  if (!data.session || !data.session.sessionId) {
    errors.push('Missing session information');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 清洗数据
 */
function cleanData(data) {
  // 移除敏感信息
  const cleaned = { ...data };

  // 限制字符串长度
  if (cleaned.message && cleaned.message.length > 1000) {
    cleaned.message = cleaned.message.substring(0, 1000) + '...';
  }

  if (cleaned.stack && cleaned.stack.length > 5000) {
    cleaned.stack = cleaned.stack.substring(0, 5000) + '...';
  }

  // 清理 breadcrumbs 中的敏感数据
  if (cleaned.breadcrumbs && Array.isArray(cleaned.breadcrumbs)) {
    cleaned.breadcrumbs = cleaned.breadcrumbs.map(crumb => {
      const cleanedCrumb = { ...crumb };

      // 移除可能包含敏感信息的字段
      if (cleanedCrumb.data && cleanedCrumb.data.value) {
        delete cleanedCrumb.data.value;
      }

      return cleanedCrumb;
    });
  }

  // 清理用户信息中的敏感字段
  if (cleaned.session && cleaned.session.userInfo) {
    const userInfo = { ...cleaned.session.userInfo };
    delete userInfo.password;
    delete userInfo.token;
    delete userInfo.accessToken;
    cleaned.session.userInfo = userInfo;
  }

  return cleaned;
}

/**
 * 验证 Session 数据
 */
function validateSessionData(data) {
  const errors = [];

  if (!data.sessionId) {
    errors.push('Missing required field: sessionId');
  }

  if (!data.userId) {
    errors.push('Missing required field: userId');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

module.exports = {
  validateErrorData,
  validateSessionData,
  cleanData,
};
