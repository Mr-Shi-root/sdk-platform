/**
 * Session 管理器
 * 负责管理用户会话，从登录到离开的完整生命周期
 */

import { generateUniqueId } from '../utils';

class SessionManager {
  constructor() {
    this.sessionId = null;
    this.userId = null;
    this.sessionStartTime = null;
    this.sessionDuration = 0;
    this.pageViewCount = 0;
    this.errorCount = 0;

    // 尝试从 localStorage 恢复 Session
    this.loadFromStorage();

    // 如果没有 Session，自动创建匿名 Session
    if (!this.sessionId) {
      this.initAnonymousSession();
    }

    // 监听页面卸载，更新 Session 时长
    this.setupUnloadListener();
  }

  /**
   * 初始化用户 Session（用户登录时调用）
   * @param {string} userId - 用户ID
   * @param {object} userInfo - 用户信息
   */
  initSession(userId, userInfo = {}) {
    this.sessionId = this.generateSessionId();
    this.userId = userId;
    this.userInfo = userInfo;
    this.sessionStartTime = Date.now();
    this.pageViewCount = 0;
    this.errorCount = 0;

    // 存储到 localStorage，页面刷新保持
    this.saveToStorage();

    // 上报 Session 开始事件
    this.reportSessionStart();

    console.log('[SessionManager] Session initialized:', this.sessionId);
  }

  /**
   * 初始化匿名 Session（用户未登录时）
   */
  initAnonymousSession() {
    this.sessionId = this.generateSessionId();
    this.userId = 'anonymous-' + generateUniqueId();
    this.sessionStartTime = Date.now();
    this.pageViewCount = 0;
    this.errorCount = 0;

    this.saveToStorage();
    console.log('[SessionManager] Anonymous session initialized:', this.sessionId);
  }

  /**
   * 生成唯一 Session ID
   */
  generateSessionId() {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 获取当前 Session 上下文信息
   */
  getSessionContext() {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      userInfo: this.userInfo || {},
      sessionStartTime: this.sessionStartTime,
      sessionDuration: Date.now() - this.sessionStartTime,
      pageViewCount: this.pageViewCount,
      errorCount: this.errorCount,
      deviceInfo: this.getDeviceInfo(),
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
    };
  }

  /**
   * 获取设备信息
   */
  getDeviceInfo() {
    return {
      platform: navigator.platform,
      language: navigator.language,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      colorDepth: window.screen.colorDepth,
      pixelRatio: window.devicePixelRatio,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      online: navigator.onLine,
      cookieEnabled: navigator.cookieEnabled,
    };
  }

  /**
   * 增加页面浏览计数
   */
  incrementPageView() {
    this.pageViewCount++;
    this.saveToStorage();
  }

  /**
   * 增加错误计数
   */
  incrementErrorCount() {
    this.errorCount++;
    this.saveToStorage();
  }

  /**
   * 更新用户信息
   */
  updateUserInfo(userInfo) {
    this.userInfo = { ...this.userInfo, ...userInfo };
    this.saveToStorage();
  }

  /**
   * 结束 Session（用户登出时调用）
   */
  endSession() {
    this.reportSessionEnd();
    this.clearStorage();

    // 重新初始化匿名 Session
    this.initAnonymousSession();
  }

  /**
   * 持久化到 localStorage
   */
  saveToStorage() {
    try {
      const sessionData = {
        sessionId: this.sessionId,
        userId: this.userId,
        userInfo: this.userInfo,
        sessionStartTime: this.sessionStartTime,
        pageViewCount: this.pageViewCount,
        errorCount: this.errorCount,
      };
      localStorage.setItem('__webEye_session__', JSON.stringify(sessionData));
    } catch (e) {
      console.warn('[SessionManager] Failed to save session:', e);
    }
  }

  /**
   * 从 localStorage 恢复
   */
  loadFromStorage() {
    try {
      const stored = localStorage.getItem('__webEye_session__');
      if (stored) {
        const sessionData = JSON.parse(stored);

        // 检查 Session 是否过期（超过 30 分钟）
        const now = Date.now();
        const sessionAge = now - sessionData.sessionStartTime;
        const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 分钟

        if (sessionAge < SESSION_TIMEOUT) {
          this.sessionId = sessionData.sessionId;
          this.userId = sessionData.userId;
          this.userInfo = sessionData.userInfo;
          this.sessionStartTime = sessionData.sessionStartTime;
          this.pageViewCount = sessionData.pageViewCount || 0;
          this.errorCount = sessionData.errorCount || 0;

          console.log('[SessionManager] Session restored from storage');
        } else {
          console.log('[SessionManager] Session expired, will create new one');
          this.clearStorage();
        }
      }
    } catch (e) {
      console.warn('[SessionManager] Failed to load session:', e);
    }
  }

  /**
   * 清除存储
   */
  clearStorage() {
    try {
      localStorage.removeItem('__webEye_session__');
    } catch (e) {
      console.warn('[SessionManager] Failed to clear storage:', e);
    }
  }

  /**
   * 监听页面卸载
   */
  setupUnloadListener() {
    window.addEventListener('beforeunload', () => {
      this.reportSessionEnd();
    });

    // 监听页面可见性变化
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.saveToStorage();
      }
    });
  }

  /**
   * 上报 Session 开始事件
   */
  reportSessionStart() {
    // 这里可以调用上报接口
    console.log('[SessionManager] Session started:', this.getSessionContext());
  }

  /**
   * 上报 Session 结束事件
   */
  reportSessionEnd() {
    const sessionContext = this.getSessionContext();
    console.log('[SessionManager] Session ended:', sessionContext);

    // 使用 sendBeacon 确保数据发送
    if (navigator.sendBeacon) {
      const data = JSON.stringify({
        type: 'session',
        subType: 'end',
        ...sessionContext,
      });
      // navigator.sendBeacon('/api/session/end', data);
    }
  }
}

// 单例模式
let sessionManagerInstance = null;

export function getSessionManager() {
  if (!sessionManagerInstance) {
    sessionManagerInstance = new SessionManager();
  }
  return sessionManagerInstance;
}

export default SessionManager;
 