/**
 * 错误上报器（增强版）
 * 上报错误时附带完整的 Session 上下文和 Breadcrumb 行为链路
 */

import { getSessionManager } from '../session/SessionManager';
import { getBreadcrumbManager } from '../breadcrumb/BreadcrumbManager';
import { report } from '../report';
import crypto from 'crypto';

class ErrorReporter {
  constructor() {
    this.sessionManager = getSessionManager();
    this.breadcrumbManager = getBreadcrumbManager();
    this.isInitialized = false;
  }

  /**
   * 初始化错误监听
   */
  init() {
    if (this.isInitialized) {
      console.warn('[ErrorReporter] Already initialized');
      return;
    }

    this.setupErrorHandlers();
    this.isInitialized = true;
    console.log('[ErrorReporter] Initialized');
  }

  /**
   * 设置错误处理器
   */
  setupErrorHandlers() {
    const self = this;

    // 1. 捕获资源加载失败的错误：js css img
    window.addEventListener('error', function(event) {
      const target = event.target;

      // 资源加载错误
      if (target && (target.src || target.href)) {
        const url = target.src || target.href;
        self.reportResourceError({
          url,
          tagName: target.tagName,
          outerHTML: target.outerHTML,
          message: event.message || `资源加载失败: ${url}`,
        });
      }
      // JS 运行时错误（作为备用，主要由 window.onerror 处理）
      else if (!target && event.message) {
        // 这种情况由 window.onerror 处理
      }
    }, true);

    // 2. 捕获 JS 语法和运行时错误
    window.onerror = function(message, source, lineno, colno, error) {
      self.reportJSError({
        message,
        source,
        lineno,
        colno,
        error,
        stack: error?.stack,
      });
      return false; // 不阻止默认错误处理
    };

    // 3. 捕获 Promise 未处理的 rejection
    window.addEventListener('unhandledrejection', function(event) {
      self.reportPromiseError({
        reason: event.reason,
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack,
        promise: event.promise,
      });
    });

    // 4. 捕获 Vue 错误（如果使用 Vue）
    if (window.Vue && window.Vue.config) {
      const originalErrorHandler = window.Vue.config.errorHandler;
      window.Vue.config.errorHandler = function(err, vm, info) {
        self.reportVueError({
          error: err,
          component: vm?.$options?.name || 'unknown',
          info,
          stack: err.stack,
        });

        if (originalErrorHandler) {
          originalErrorHandler.call(this, err, vm, info);
        }
      };
    }
  }

  /**
   * 上报 JS 错误
   */
  reportJSError(errorData) {
    const errorTime = Date.now();

    // 添加错误到面包屑
    this.breadcrumbManager.addBreadcrumb({
      type: 'error',
      category: 'js',
      message: `JS错误: ${errorData.message}`,
      data: errorData,
    });

    // 增加错误计数
    this.sessionManager.incrementErrorCount();

    // 构建完整的错误报告
    const fullReport = {
      // 错误基本信息
      type: 'error',
      subType: 'js',
      errorId: this.generateErrorId(errorData),
      message: errorData.message,
      source: errorData.source,
      lineno: errorData.lineno,
      colno: errorData.colno,
      stack: errorData.stack,
      errorName: errorData.error?.name,

      // Session 上下文
      session: this.sessionManager.getSessionContext(),

      // 完整行为链路（错误发生前的所有操作）
      breadcrumbs: this.breadcrumbManager.getBreadcrumbsBeforeError(errorTime, 30),

      // 错误发生时的页面状态
      pageState: this.getPageState(),

      // 用户环境信息
      environment: this.getEnvironment(),

      // 时间戳
      timestamp: errorTime,
    };

    // 立即上报（错误优先级高）
    this.sendReport(fullReport);

    console.log('[ErrorReporter] JS Error reported:', fullReport);
  }

  /**
   * 上报资源加载错误
   */
  reportResourceError(errorData) {
    const errorTime = Date.now();

    this.breadcrumbManager.addBreadcrumb({
      type: 'error',
      category: 'resource',
      message: `资源加载失败: ${errorData.url}`,
      data: errorData,
    });

    this.sessionManager.incrementErrorCount();

    const fullReport = {
      type: 'error',
      subType: 'resource',
      errorId: this.generateErrorId(errorData),
      url: errorData.url,
      tagName: errorData.tagName,
      outerHTML: errorData.outerHTML,
      message: errorData.message,

      session: this.sessionManager.getSessionContext(),
      breadcrumbs: this.breadcrumbManager.getBreadcrumbsBeforeError(errorTime, 30),
      pageState: this.getPageState(),
      environment: this.getEnvironment(),
      timestamp: errorTime,
    };

    this.sendReport(fullReport);
    console.log('[ErrorReporter] Resource Error reported:', fullReport);
  }

  /**
   * 上报 Promise 错误
   */
  reportPromiseError(errorData) {
    const errorTime = Date.now();

    this.breadcrumbManager.addBreadcrumb({
      type: 'error',
      category: 'promise',
      message: `Promise错误: ${errorData.message}`,
      data: errorData,
    });

    this.sessionManager.incrementErrorCount();

    const fullReport = {
      type: 'error',
      subType: 'promise',
      errorId: this.generateErrorId(errorData),
      message: errorData.message,
      stack: errorData.stack,
      reason: String(errorData.reason),

      session: this.sessionManager.getSessionContext(),
      breadcrumbs: this.breadcrumbManager.getBreadcrumbsBeforeError(errorTime, 30),
      pageState: this.getPageState(),
      environment: this.getEnvironment(),
      timestamp: errorTime,
    };

    this.sendReport(fullReport);
    console.log('[ErrorReporter] Promise Error reported:', fullReport);
  }

  /**
   * 上报 Vue 错误
   */
  reportVueError(errorData) {
    const errorTime = Date.now();

    this.breadcrumbManager.addBreadcrumb({
      type: 'error',
      category: 'vue',
      message: `Vue错误: ${errorData.error?.message}`,
      data: errorData,
    });

    this.sessionManager.incrementErrorCount();

    const fullReport = {
      type: 'error',
      subType: 'vue',
      errorId: this.generateErrorId(errorData),
      message: errorData.error?.message,
      component: errorData.component,
      info: errorData.info,
      stack: errorData.stack,

      session: this.sessionManager.getSessionContext(),
      breadcrumbs: this.breadcrumbManager.getBreadcrumbsBeforeError(errorTime, 30),
      pageState: this.getPageState(),
      environment: this.getEnvironment(),
      timestamp: errorTime,
    };

    this.sendReport(fullReport);
    console.log('[ErrorReporter] Vue Error reported:', fullReport);
  }

  /**
   * 手动上报错误（供业务代码调用）
   */
  reportCustomError(errorData) {
    const errorTime = Date.now();

    this.breadcrumbManager.addBreadcrumb({
      type: 'error',
      category: 'custom',
      message: `自定义错误: ${errorData.message}`,
      data: errorData,
    });

    this.sessionManager.incrementErrorCount();

    const fullReport = {
      type: 'error',
      subType: 'custom',
      errorId: this.generateErrorId(errorData),
      ...errorData,

      session: this.sessionManager.getSessionContext(),
      breadcrumbs: this.breadcrumbManager.getBreadcrumbsBeforeError(errorTime, 30),
      pageState: this.getPageState(),
      environment: this.getEnvironment(),
      timestamp: errorTime,
    };

    this.sendReport(fullReport);
    console.log('[ErrorReporter] Custom Error reported:', fullReport);
  }

  /**
   * 生成错误 ID（用于聚合相同错误）
   */
  generateErrorId(errorData) {
    // 使用错误信息和堆栈生成唯一 ID
    const key = `${errorData.message || ''}_${errorData.stack || errorData.source || ''}`;

    // 简单的哈希函数
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }

    return `err-${Math.abs(hash).toString(36)}`;
  }

  /**
   * 获取页面状态
   */
  getPageState() {
    return {
      url: window.location.href,
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      title: document.title,
      referrer: document.referrer,
      visibility: document.visibilityState,
      scrollPosition: {
        x: window.pageXOffset || document.documentElement.scrollLeft,
        y: window.pageYOffset || document.documentElement.scrollTop,
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      documentSize: {
        width: document.documentElement.scrollWidth,
        height: document.documentElement.scrollHeight,
      },
    };
  }

  /**
   * 获取环境信息
   */
  getEnvironment() {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      languages: navigator.languages,
      platform: navigator.platform,
      online: navigator.onLine,
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      colorDepth: window.screen.colorDepth,
      pixelRatio: window.devicePixelRatio,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneOffset: new Date().getTimezoneOffset(),
    };
  }

  /**
   * 发送错误报告
   */
  sendReport(data) {
    // 使用现有的 report 函数
    report(data);

    // 也可以使用 sendBeacon 确保数据发送（页面卸载时）
    if (navigator.sendBeacon) {
      try {
        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        // navigator.sendBeacon('/api/error/report', blob);
      } catch (e) {
        console.warn('[ErrorReporter] sendBeacon failed:', e);
      }
    }
  }
}

// 单例模式
let errorReporterInstance = null;

export function getErrorReporter() {
  if (!errorReporterInstance) {
    errorReporterInstance = new ErrorReporter();
  }
  return errorReporterInstance;
}

export default ErrorReporter;
