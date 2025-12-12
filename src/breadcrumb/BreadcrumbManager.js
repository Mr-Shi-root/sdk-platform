/**
 * Breadcrumb（面包屑）管理器
 * 记录用户操作路径，用于错误现场还原
 */

class BreadcrumbManager {
  constructor(maxBreadcrumbs = 50) {
    this.breadcrumbs = [];
    this.maxBreadcrumbs = maxBreadcrumbs;
    this.sequence = 0;

    // 尝试从 sessionStorage 恢复
    this.loadFromStorage();
  }

  /**
   * 添加面包屑
   * @param {object} breadcrumb - 面包屑数据
   * @param {string} breadcrumb.type - 类型：navigation/user/http/console/error
   * @param {string} breadcrumb.category - 分类：pageview/click/ajax/log等
   * @param {string} breadcrumb.message - 描述信息
   * @param {object} breadcrumb.data - 附加数据
   */
  addBreadcrumb(breadcrumb) {
    this.sequence++;

    const crumb = {
      ...breadcrumb,
      timestamp: Date.now(),
      sequence: this.sequence,
      // 添加相对时间（方便计算时间间隔）
      relativeTime: this.getRelativeTime(),
    };

    this.breadcrumbs.push(crumb);

    // 保持最大数量限制（环形队列）
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs.shift();
    }

    // 实时存储到 sessionStorage（防止页面崩溃丢失）
    this.saveToStorage();

    console.log('[BreadcrumbManager] Added:', crumb);
  }

  /**
   * 获取所有面包屑
   */
  getBreadcrumbs() {
    return [...this.breadcrumbs];
  }

  /**
   * 获取最近 N 条面包屑
   */
  getRecentBreadcrumbs(count = 10) {
    return this.breadcrumbs.slice(-count);
  }

  /**
   * 按类型过滤面包屑
   */
  getBreadcrumbsByType(type) {
    return this.breadcrumbs.filter(crumb => crumb.type === type);
  }

  /**
   * 按时间范围获取面包屑
   */
  getBreadcrumbsByTimeRange(startTime, endTime) {
    return this.breadcrumbs.filter(
      crumb => crumb.timestamp >= startTime && crumb.timestamp <= endTime
    );
  }

  /**
   * 获取错误发生前的面包屑（用于错误上报）
   */
  getBreadcrumbsBeforeError(errorTime, count = 20) {
    const beforeError = this.breadcrumbs.filter(
      crumb => crumb.timestamp <= errorTime
    );
    return beforeError.slice(-count);
  }

  /**
   * 清空面包屑
   */
  clear() {
    this.breadcrumbs = [];
    this.sequence = 0;
    sessionStorage.removeItem('__webEye_breadcrumbs__');
    console.log('[BreadcrumbManager] Cleared all breadcrumbs');
  }

  /**
   * 获取相对时间（从第一个面包屑开始）
   */
  getRelativeTime() {
    if (this.breadcrumbs.length === 0) {
      return 0;
    }
    const firstTimestamp = this.breadcrumbs[0].timestamp;
    return Date.now() - firstTimestamp;
  }

  /**
   * 持久化到 sessionStorage
   */
  saveToStorage() {
    try {
      const data = {
        breadcrumbs: this.breadcrumbs,
        sequence: this.sequence,
      };
      sessionStorage.setItem('__webEye_breadcrumbs__', JSON.stringify(data));
    } catch (e) {
      console.warn('[BreadcrumbManager] Failed to save breadcrumbs:', e);
      // 如果存储失败（可能是容量满了），清理旧数据
      if (e.name === 'QuotaExceededError') {
        this.breadcrumbs = this.breadcrumbs.slice(-20); // 只保留最近20条
        this.saveToStorage();
      }
    }
  }

  /**
   * 从 sessionStorage 恢复
   */
  loadFromStorage() {
    try {
      const stored = sessionStorage.getItem('__webEye_breadcrumbs__');
      if (stored) {
        const data = JSON.parse(stored);
        this.breadcrumbs = data.breadcrumbs || [];
        this.sequence = data.sequence || 0;
        console.log('[BreadcrumbManager] Restored from storage:', this.breadcrumbs.length);
      }
    } catch (e) {
      console.warn('[BreadcrumbManager] Failed to load breadcrumbs:', e);
    }
  }

  /**
   * 格式化面包屑为可读文本（用于调试）
   */
  formatBreadcrumbs() {
    return this.breadcrumbs.map(crumb => {
      const time = new Date(crumb.timestamp).toLocaleTimeString();
      const icon = this.getIconForType(crumb.type);
      return `${time} ${icon} ${crumb.message}`;
    }).join('\n');
  }

  /**
   * 获取类型对应的图标
   */
  getIconForType(type) {
    const icons = {
      navigation: '🌐',
      user: '👆',
      http: '🌐',
      console: '📝',
      error: '❌',
    };
    return icons[type] || '•';
  }

  /**
   * 获取统计信息
   */
  getStats() {
    const stats = {
      total: this.breadcrumbs.length,
      byType: {},
      byCategory: {},
    };

    this.breadcrumbs.forEach(crumb => {
      // 按类型统计
      stats.byType[crumb.type] = (stats.byType[crumb.type] || 0) + 1;
      // 按分类统计
      stats.byCategory[crumb.category] = (stats.byCategory[crumb.category] || 0) + 1;
    });

    return stats;
  }
}

// 单例模式
let breadcrumbManagerInstance = null;

export function getBreadcrumbManager() {
  if (!breadcrumbManagerInstance) {
    breadcrumbManagerInstance = new BreadcrumbManager();
  }
  return breadcrumbManagerInstance;
}

export default BreadcrumbManager;
