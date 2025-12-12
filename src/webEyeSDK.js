/**
 * WebEye SDK - 前端监控 SDK
 * 支持错误监控、性能监控、用户行为追踪、完整行为链路还原
 *
 * 版本: 2.0.0
 * 新增功能:
 * - Session 管理
 * - Breadcrumb 行为链路追踪
 * - 完整的错误上下文上报
 * - 用户行为路径还原
 */

import { lazyReportBatch } from "./report";
import performance from "./performance/index";
import error from "./error/index";
import behavior from "./behavior/index";
import { setConfig } from './config';

// 导入新模块
import { getSessionManager } from './session/SessionManager';
import { getBreadcrumbManager } from './breadcrumb/BreadcrumbManager';
import { getBehaviorTracker } from './tracker/BehaviorTracker';
import { getErrorReporter } from './error/ErrorReporter';

window.__webEyeSDK__ = {
   version: '2.0.0',
   sessionManager: null,
   breadcrumbManager: null,
   behaviorTracker: null,
   errorReporter: null,
}

/**
 * 初始化 SDK
 * @param {object} options - 配置选项
 * @param {string} options.url - 上报地址
 * @param {string} options.projectKey - 项目Key
 * @param {boolean} options.enableBehaviorTracking - 是否启用行为追踪（默认true）
 * @param {boolean} options.enableErrorTracking - 是否启用错误追踪（默认true）
 * @param {boolean} options.enablePerformanceTracking - 是否启用性能监控（默认false）
 * @param {number} options.maxBreadcrumbs - 最大面包屑数量（默认50）
 * @param {boolean} options.isImageUpload - 是否使用图片上报（默认false）
 * @param {number} options.batchSize - 批量上报数据条数（默认20）
 */
export function init(options = {}) {
   // 设置配置
   setConfig(options);

   // 初始化 Session 管理器
   __webEyeSDK__.sessionManager = getSessionManager();

   // 初始化 Breadcrumb 管理器
   __webEyeSDK__.breadcrumbManager = getBreadcrumbManager();

   // 初始化行为追踪器
   if (options.enableBehaviorTracking !== false) {
      __webEyeSDK__.behaviorTracker = getBehaviorTracker();
      __webEyeSDK__.behaviorTracker.init();
      console.log('[WebEyeSDK] Behavior tracking enabled');
   }

   // 初始化错误上报器
   if (options.enableErrorTracking !== false) {
      __webEyeSDK__.errorReporter = getErrorReporter();
      __webEyeSDK__.errorReporter.init();
      console.log('[WebEyeSDK] Error tracking enabled');
   }

   // 初始化性能监控（可选）
   if (options.enablePerformanceTracking) {
      performance();
      console.log('[WebEyeSDK] Performance tracking enabled');
   }

   console.log(`[WebEyeSDK] Initialized v${__webEyeSDK__.version}`);
}

/**
 * 设置用户信息（用户登录后调用）
 * @param {string} userId - 用户ID
 * @param {object} userInfo - 用户信息
 */
export function setUser(userId, userInfo = {}) {
   if (__webEyeSDK__.sessionManager) {
      __webEyeSDK__.sessionManager.initSession(userId, userInfo);
      console.log('[WebEyeSDK] User set:', userId);
   }
}

/**
 * 清除用户信息（用户登出时调用）
 */
export function clearUser() {
   if (__webEyeSDK__.sessionManager) {
      __webEyeSDK__.sessionManager.endSession();
      console.log('[WebEyeSDK] User cleared');
   }
}

/**
 * 手动上报错误
 * @param {Error|string} error - 错误对象或错误信息
 * @param {object} extra - 额外信息
 */
export function captureError(error, extra = {}) {
   if (__webEyeSDK__.errorReporter) {
      const errorData = {
         message: error.message || String(error),
         stack: error.stack,
         ...extra,
      };
      __webEyeSDK__.errorReporter.reportCustomError(errorData);
   }
}

/**
 * 手动添加面包屑
 * @param {object} breadcrumb - 面包屑数据
 */
export function addBreadcrumb(breadcrumb) {
   if (__webEyeSDK__.breadcrumbManager) {
      __webEyeSDK__.breadcrumbManager.addBreadcrumb(breadcrumb);
   }
}

/**
 * 获取当前 Session 信息
 */
export function getSessionInfo() {
   if (__webEyeSDK__.sessionManager) {
      return __webEyeSDK__.sessionManager.getSessionContext();
   }
   return null;
}

/**
 * 获取行为链路
 */
export function getBreadcrumbs() {
   if (__webEyeSDK__.breadcrumbManager) {
      return __webEyeSDK__.breadcrumbManager.getBreadcrumbs();
   }
   return [];
}

/**
 * Vue 插件安装方法
 * @param {object} Vue - Vue 实例
 * @param {object} options - 配置选项
 */
export function install(Vue, options) {
   if (__webEyeSDK__.vue) return;
   __webEyeSDK__.vue = true;

   // 初始化 SDK
   init(options);

   const handler = Vue.config.errorHandler;

   // 重写 Vue 的 errorHandler
   Vue.config.errorHandler = function(err, vm, info) {
      // 使用新的错误上报器
      if (__webEyeSDK__.errorReporter) {
         __webEyeSDK__.errorReporter.reportVueError({
            error: err,
            component: vm?.$options?.name || 'unknown',
            info,
            stack: err.stack,
         });
      }

      // 执行原来的 errorHandler
      if (handler) {
         handler.call(this, err, vm, info);
      }
   };

   console.log('[WebEyeSDK] Vue plugin installed');
}

/**
 * React ErrorBoundary 错误处理
 * @param {Error} err - 错误对象
 * @param {object} info - 错误信息
 */
export function errorBoundary(err, info) {
   if (__webEyeSDK__.react) return;
   __webEyeSDK__.react = true;

   // 使用新的错误上报器
   if (__webEyeSDK__.errorReporter) {
      __webEyeSDK__.errorReporter.reportCustomError({
         message: err?.message,
         stack: err?.stack,
         info,
         subType: 'react',
      });
   }

   console.log('[WebEyeSDK] React error boundary triggered');
}

/**
 * 使用示例:
 *
 * // 1. 基础初始化
 * webEyeSDK.init({
 *    url: 'https://your-api.com/api/error/report',
 *    projectKey: 'your-project-key',
 *    enableBehaviorTracking: true,
 *    enableErrorTracking: true,
 *    enablePerformanceTracking: false,
 *    maxBreadcrumbs: 50,
 *    batchSize: 20,
 * });
 *
 * // 2. 用户登录后设置用户信息
 * webEyeSDK.setUser('user-123', {
 *    username: '张三',
 *    email: 'zhangsan@example.com',
 * });
 *
 * // 3. 手动上报错误
 * try {
 *    // 业务代码
 * } catch (error) {
 *    webEyeSDK.captureError(error, { context: 'payment' });
 * }
 *
 * // 4. 手动添加面包屑
 * webEyeSDK.addBreadcrumb({
 *    type: 'user',
 *    category: 'action',
 *    message: '用户点击了支付按钮',
 *    data: { amount: 100 },
 * });
 *
 * // 5. 用户登出时清除信息
 * webEyeSDK.clearUser();
 *
 * // 6. Vue 项目使用
 * import webEyeSDK from 'webEyeSDK';
 * Vue.use(webEyeSDK, { url: 'xxx', projectKey: 'xxx' });
 *
 * // 7. React 项目使用
 * import { errorBoundary } from 'webEyeSDK';
 * class ErrorBoundary extends React.Component {
 *    componentDidCatch(error, errorInfo) {
 *       errorBoundary(error, errorInfo);
 *    }
 * }
 */

export default {
   init,
   setUser,
   clearUser,
   captureError,
   addBreadcrumb,
   getSessionInfo,
   getBreadcrumbs,
   install,
   errorBoundary,
   performance,
   error,
   behavior,
}