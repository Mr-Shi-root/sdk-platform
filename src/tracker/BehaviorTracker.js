/**
 * 行为链路追踪器
 * 自动收集用户的所有操作行为，记录到 Breadcrumb
 */

import { getBreadcrumbManager } from '../breadcrumb/BreadcrumbManager';
import { getSessionManager } from '../session/SessionManager';

class BehaviorTracker {
  constructor() {
    this.breadcrumbManager = getBreadcrumbManager();
    this.sessionManager = getSessionManager();
    this.isInitialized = false;
  }

  /**
   * 初始化所有行为监听
   */
  init() {
    if (this.isInitialized) {
      console.warn('[BehaviorTracker] Already initialized');
      return;
    }

    this.trackPageView();
    this.trackRouteChange();
    this.trackClick();
    this.trackInput();
    this.trackScroll();
    this.trackAjax();
    this.trackFetch();
    this.trackConsole();
    this.trackPageVisibility();

    this.isInitialized = true;
    console.log('[BehaviorTracker] Initialized');
  }

  /**
   * 1. 页面访问
   */
  trackPageView() {
    this.breadcrumbManager.addBreadcrumb({
      type: 'navigation',
      category: 'pageview',
      message: `访问页面: ${window.location.pathname}`,
      data: {
        url: window.location.href,
        referrer: document.referrer,
        title: document.title,
        pathname: window.location.pathname,
        search: window.location.search,
      },
    });

    // 增加页面浏览计数
    this.sessionManager.incrementPageView();
  }

  /**
   * 2. 路由变化（SPA）
   */
  trackRouteChange() {
    // 监听 history API
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    const self = this;

    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      self.breadcrumbManager.addBreadcrumb({
        type: 'navigation',
        category: 'route',
        message: `路由跳转: ${location.pathname}`,
        data: {
          path: location.pathname,
          search: location.search,
          hash: location.hash,
          state: args[0],
        },
      });
      self.sessionManager.incrementPageView();
    };

    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      self.breadcrumbManager.addBreadcrumb({
        type: 'navigation',
        category: 'route',
        message: `路由替换: ${location.pathname}`,
        data: {
          path: location.pathname,
          search: location.search,
          hash: location.hash,
          state: args[0],
        },
      });
    };

    // 监听 popstate（浏览器前进后退）
    window.addEventListener('popstate', () => {
      self.breadcrumbManager.addBreadcrumb({
        type: 'navigation',
        category: 'route',
        message: `浏览器导航: ${location.pathname}`,
        data: {
          path: location.pathname,
          search: location.search,
          hash: location.hash,
        },
      });
    });

    // 监听 hash 变化
    window.addEventListener('hashchange', (e) => {
      self.breadcrumbManager.addBreadcrumb({
        type: 'navigation',
        category: 'hash',
        message: `Hash变化: ${location.hash}`,
        data: {
          oldURL: e.oldURL,
          newURL: e.newURL,
          hash: location.hash,
        },
      });
    });
  }

  /**
   * 3. 点击事件
   */
  trackClick() {
    const self = this;
    ['mousedown', 'touchstart'].forEach(eventType => {
      document.addEventListener(eventType, (e) => {
        const target = e.target;
        if (!target || !target.tagName) {
          return;
        }

        const selector = self.getElementSelector(target);
        const innerText = target.innerText?.substring(0, 50) || '';

        self.breadcrumbManager.addBreadcrumb({
          type: 'user',
          category: 'click',
          message: `点击元素: ${selector}${innerText ? ` "${innerText}"` : ''}`,
          data: {
            selector,
            tagName: target.tagName,
            innerText,
            className: target.className,
            id: target.id,
            position: { x: e.clientX, y: e.clientY },
            eventType,
          },
        });
      }, true);
    });
  }

  /**
   * 4. 输入事件（防抖）
   */
  trackInput() {
    const self = this;
    let timer;

    document.addEventListener('input', (e) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const target = e.target;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
          const selector = self.getElementSelector(target);

          self.breadcrumbManager.addBreadcrumb({
            type: 'user',
            category: 'input',
            message: `输入内容: ${selector}`,
            data: {
              selector,
              name: target.name,
              id: target.id,
              type: target.type,
              placeholder: target.placeholder,
              // 敏感信息脱敏
              value: self.maskSensitiveData(target.value, target.type),
            },
          });
        }
      }, 500);
    }, true);

    // 监听表单提交
    document.addEventListener('submit', (e) => {
      const form = e.target;
      const selector = self.getElementSelector(form);

      self.breadcrumbManager.addBreadcrumb({
        type: 'user',
        category: 'submit',
        message: `提交表单: ${selector}`,
        data: {
          selector,
          action: form.action,
          method: form.method,
        },
      });
    }, true);
  }

  /**
   * 5. 滚动事件（节流）
   */
  trackScroll() {
    const self = this;
    let lastScrollTime = 0;

    window.addEventListener('scroll', () => {
      const now = Date.now();
      if (now - lastScrollTime > 2000) { // 2秒节流
        lastScrollTime = now;

        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight;
        const clientHeight = document.documentElement.clientHeight;
        const scrollPercent = Math.round((scrollTop / (scrollHeight - clientHeight)) * 100);

        self.breadcrumbManager.addBreadcrumb({
          type: 'user',
          category: 'scroll',
          message: `页面滚动: ${scrollPercent}%`,
          data: {
            scrollTop,
            scrollHeight,
            clientHeight,
            scrollPercent,
          },
        });
      }
    });
  }

  /**
   * 6. Ajax 请求（XMLHttpRequest）
   */
  trackAjax() {
    const self = this;
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(method, url, ...args) {
      this._requestInfo = {
        method,
        url,
        startTime: Date.now(),
      };
      return originalOpen.call(this, method, url, ...args);
    };

    XMLHttpRequest.prototype.send = function(...args) {
      const xhr = this;
      const startTime = Date.now();

      // 监听请求完成
      const onLoadEnd = function() {
        const duration = Date.now() - startTime;
        const status = xhr.status;
        const isError = status === 0 || status >= 400;

        self.breadcrumbManager.addBreadcrumb({
          type: 'http',
          category: 'ajax',
          message: `Ajax ${isError ? '失败' : '成功'}: ${xhr._requestInfo.method} ${xhr._requestInfo.url}`,
          data: {
            method: xhr._requestInfo.method,
            url: xhr._requestInfo.url,
            status,
            statusText: xhr.statusText,
            duration,
            isError,
          },
        });
      };

      xhr.addEventListener('loadend', onLoadEnd);

      return originalSend.apply(this, args);
    };
  }

  /**
   * 7. Fetch 请求
   */
  trackFetch() {
    const self = this;
    const originalFetch = window.fetch;

    window.fetch = async function(...args) {
      const startTime = Date.now();
      const url = typeof args[0] === 'string' ? args[0] : args[0].url;
      const method = args[1]?.method || 'GET';

      try {
        const response = await originalFetch(...args);
        const duration = Date.now() - startTime;
        const isError = !response.ok;

        self.breadcrumbManager.addBreadcrumb({
          type: 'http',
          category: 'fetch',
          message: `Fetch ${isError ? '失败' : '成功'}: ${method} ${url}`,
          data: {
            method,
            url,
            status: response.status,
            statusText: response.statusText,
            duration,
            isError,
          },
        });

        return response;
      } catch (error) {
        const duration = Date.now() - startTime;

        self.breadcrumbManager.addBreadcrumb({
          type: 'http',
          category: 'fetch',
          message: `Fetch异常: ${method} ${url}`,
          data: {
            method,
            url,
            error: error.message,
            duration,
            isError: true,
          },
        });

        throw error;
      }
    };
  }

  /**
   * 8. Console 日志
   */
  trackConsole() {
    const self = this;
    ['log', 'info', 'warn', 'error', 'debug'].forEach(level => {
      const original = console[level];
      console[level] = function(...args) {
        // 只记录 warn 和 error
        if (level === 'warn' || level === 'error') {
          self.breadcrumbManager.addBreadcrumb({
            type: 'console',
            category: level,
            message: `Console.${level}`,
            data: {
              arguments: args.map(arg => {
                if (typeof arg === 'object') {
                  try {
                    return JSON.stringify(arg);
                  } catch (e) {
                    return String(arg);
                  }
                }
                return String(arg);
              }).join(' ').substring(0, 200), // 限制长度
            },
          });
        }

        original.apply(console, args);
      };
    });
  }

  /**
   * 9. 页面可见性变化
   */
  trackPageVisibility() {
    const self = this;

    document.addEventListener('visibilitychange', () => {
      const state = document.visibilityState;

      self.breadcrumbManager.addBreadcrumb({
        type: 'navigation',
        category: 'visibility',
        message: `页面${state === 'visible' ? '可见' : '隐藏'}`,
        data: {
          visibilityState: state,
          hidden: document.hidden,
        },
      });
    });
  }

  /**
   * 工具方法：获取元素选择器
   */
  getElementSelector(element) {
    if (!element) return '';

    // 优先使用 ID
    if (element.id) {
      return `#${element.id}`;
    }

    // 其次使用 class
    if (element.className && typeof element.className === 'string') {
      const classes = element.className.split(' ').filter(c => c);
      if (classes.length > 0) {
        return `.${classes[0]}`;
      }
    }

    // 使用标签名
    let selector = element.tagName.toLowerCase();

    // 添加属性选择器
    if (element.name) {
      selector += `[name="${element.name}"]`;
    } else if (element.type) {
      selector += `[type="${element.type}"]`;
    }

    return selector;
  }

  /**
   * 工具方法：敏感数据脱敏
   */
  maskSensitiveData(value, inputType) {
    if (!value) return '';

    // 密码类型完全隐藏
    if (inputType === 'password') {
      return '******';
    }

    // 邮箱脱敏
    if (inputType === 'email' || value.includes('@')) {
      const parts = value.split('@');
      if (parts.length === 2) {
        const username = parts[0];
        const masked = username.substring(0, 2) + '***';
        return `${masked}@${parts[1]}`;
      }
    }

    // 手机号脱敏
    if (/^1[3-9]\d{9}$/.test(value)) {
      return value.substring(0, 3) + '****' + value.substring(7);
    }

    // 其他长文本截断
    if (value.length > 20) {
      return value.substring(0, 10) + '...' + value.substring(value.length - 5);
    }

    return value;
  }
}

// 单例模式
let behaviorTrackerInstance = null;

export function getBehaviorTracker() {
  if (!behaviorTrackerInstance) {
    behaviorTrackerInstance = new BehaviorTracker();
  }
  return behaviorTrackerInstance;
}

export default BehaviorTracker;
