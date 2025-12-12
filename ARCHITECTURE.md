# 错误行为路径还原全链路架构文档

## 📋 目录

- [概述](#概述)
- [整体架构](#整体架构)
- [核心功能](#核心功能)
- [技术实现](#技术实现)
- [部署指南](#部署指南)
- [使用示例](#使用示例)
- [API 文档](#api-文档)

---

## 概述

本项目实现了一个完整的**错误行为路径还原全链路架构**，能够追踪用户从登录到报错的完整操作路径，实现错误现场的完整还原。

### 核心特性

✅ **Session 管理** - 追踪用户完整会话生命周期
✅ **Breadcrumb 面包屑** - 记录用户所有操作行为
✅ **完整上下文上报** - 错误发生时附带完整环境信息
✅ **行为路径还原** - 可视化展示用户操作时间轴
✅ **错误聚合分析** - 自动聚合相同错误，统计影响范围
✅ **多平台支持** - 支持 Vue、React、原生 JS

---

## 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                    前端 SDK 层                                │
├─────────────────────────────────────────────────────────────┤
│  SessionManager    │  BreadcrumbManager                      │
│  BehaviorTracker   │  ErrorReporter                          │
└─────────────────────────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────────────────────────┐
│                    数据上报层                                 │
├─────────────────────────────────────────────────────────────┤
│  实时上报（错误）   │  批量上报（行为）                        │
│  带 Session 上下文  │  带完整 Breadcrumb                      │
└─────────────────────────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────────────────────────┐
│                    接入层（Express）                          │
├─────────────────────────────────────────────────────────────┤
│  数据验证清洗       │  Session 关联                           │
│  错误聚合           │  Breadcrumb 处理                        │
└─────────────────────────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────────────────────────┐
│                    存储层                                     │
├─────────────────────────────────────────────────────────────┤
│  Elasticsearch     │  Redis（Session缓存）                   │
│  MySQL（聚合数据）  │  原始日志 + 行为链路                    │
└─────────────────────────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────────────────────────┐
│                    监控平台（前端）                           │
├─────────────────────────────────────────────────────────────┤
│  错误详情页         │  行为路径时间轴                         │
│  用户 Session 分析  │  错误现场完整还原                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 核心功能

### 1. Session 管理

**功能描述**：追踪用户从进入网站到离开的完整会话。

**实现位置**：`src/session/SessionManager.js`

**核心能力**：
- 自动生成唯一 Session ID
- 支持匿名用户和登录用户
- Session 持久化（localStorage）
- 自动过期机制（30分钟）
- 记录页面浏览次数、错误次数

**使用方式**：
```javascript
// 用户登录后设置
webEyeSDK.setUser('user-123', {
  username: '张三',
  email: 'zhangsan@example.com'
});

// 用户登出时清除
webEyeSDK.clearUser();
```

---

### 2. Breadcrumb 面包屑

**功能描述**：记录用户的所有操作行为，形成完整的行为链路。

**实现位置**：`src/breadcrumb/BreadcrumbManager.js`

**记录的行为类型**：
- 🌐 **Navigation** - 页面访问、路由跳转
- 👆 **User** - 点击、输入、滚动、表单提交
- 🌐 **HTTP** - Ajax/Fetch 请求
- 📝 **Console** - 控制台日志（warn/error）
- ❌ **Error** - 错误发生

**数据结构**：
```javascript
{
  sequence: 1,
  type: 'user',
  category: 'click',
  message: '点击元素: #loginBtn',
  timestamp: 1733654400000,
  data: {
    selector: '#loginBtn',
    innerText: '登录',
    position: { x: 100, y: 200 }
  }
}
```

**特性**：
- 环形队列（默认保留最近50条）
- 自动持久化到 sessionStorage
- 支持按类型、时间范围过滤
- 敏感信息自动脱敏

---

### 3. 行为追踪器

**功能描述**：自动监听并记录用户的所有操作。

**实现位置**：`src/tracker/BehaviorTracker.js`

**监听的事件**：
1. **页面访问** - 页面加载、刷新
2. **路由变化** - SPA 路由跳转（history API）
3. **点击事件** - mousedown、touchstart
4. **输入事件** - input、submit（防抖500ms）
5. **滚动事件** - scroll（节流2秒）
6. **Ajax 请求** - XMLHttpRequest 拦截
7. **Fetch 请求** - Fetch API 拦截
8. **Console 日志** - console.warn/error
9. **页面可见性** - visibilitychange

**技术实现**：
- 原生 API 拦截（Proxy 模式）
- 防抖/节流优化性能
- 自动获取元素选择器
- 敏感数据脱敏处理

---

### 4. 错误上报器

**功能描述**：捕获所有类型的错误，并附带完整上下文上报。

**实现位置**：`src/error/ErrorReporter.js`

**捕获的错误类型**：
- **JS 错误** - 语法错误、运行时错误
- **资源加载错误** - JS/CSS/图片加载失败
- **Promise 错误** - unhandledrejection
- **Vue 错误** - Vue.config.errorHandler
- **React 错误** - ErrorBoundary
- **自定义错误** - 手动上报

**上报的数据结构**：
```javascript
{
  // 错误基本信息
  errorId: 'err-abc123',
  type: 'error',
  subType: 'js',
  message: 'TypeError: Cannot read property...',
  stack: '...',

  // Session 上下文
  session: {
    sessionId: 'session-xxx',
    userId: 'user-123',
    sessionDuration: 900000,
    pageViewCount: 5,
    errorCount: 1,
    deviceInfo: { ... }
  },

  // 完整行为链路（错误发生前30条）
  breadcrumbs: [ ... ],

  // 页面状态
  pageState: {
    url: 'https://example.com/profile',
    title: '用户资料',
    scrollPosition: { x: 0, y: 320 },
    visibility: 'visible'
  },

  // 环境信息
  environment: {
    userAgent: '...',
    platform: 'MacIntel',
    language: 'zh-CN',
    screenResolution: '1920x1080',
    timezone: 'Asia/Shanghai'
  },

  timestamp: 1733654415500
}
```

---

## 技术实现

### 前端 SDK

**技术栈**：原生 JavaScript（ES6+）

**核心模块**：

| 模块 | 文件路径 | 功能 |
|------|---------|------|
| SessionManager | `src/session/SessionManager.js` | Session 管理 |
| BreadcrumbManager | `src/breadcrumb/BreadcrumbManager.js` | 面包屑管理 |
| BehaviorTracker | `src/tracker/BehaviorTracker.js` | 行为追踪 |
| ErrorReporter | `src/error/ErrorReporter.js` | 错误上报 |
| WebEyeSDK | `src/webEyeSDK.js` | SDK 主入口 |

**设计模式**：
- 单例模式（所有 Manager）
- 观察者模式（事件监听）
- 代理模式（API 拦截）

---

### 后端接入层

**技术栈**：Node.js + Express

**核心服务**：

| 服务 | 文件路径 | 功能 |
|------|---------|------|
| Express Server | `server/app.js` | HTTP 服务器 |
| Elasticsearch | `server/services/elasticsearch.js` | 原始日志存储 |
| Redis | `server/services/redis.js` | Session 缓存 |
| MySQL | `server/services/mysql.js` | 聚合数据存储 |
| Validator | `server/utils/validator.js` | 数据验证清洗 |
| Hash | `server/utils/hash.js` | 错误哈希生成 |

**API 接口**：

```
POST /api/error/report       - 错误上报
POST /api/session/end        - Session 结束
GET  /api/error/:errorId     - 获取错误详情
GET  /api/errors             - 获取错误列表
GET  /api/session/:sessionId - 获取 Session 详情
GET  /health                 - 健康检查
```

---

### 数据存储

#### Elasticsearch

**用途**：存储原始日志和完整的 Breadcrumb 数据

**索引结构**：
```
error-logs-2025-12/
  - errorId (keyword)
  - sessionId (keyword)
  - userId (keyword)
  - type (keyword)
  - subType (keyword)
  - message (text)
  - stack (text)
  - stackHash (keyword)
  - breadcrumbs (nested)
  - session (object)
  - pageState (object)
  - environment (object)
  - timestamp (long)
```

#### Redis

**用途**：缓存 Session 信息，提供快速查询

**数据结构**：
```
session:{sessionId} -> JSON (TTL: 30分钟)
error:stats:{errorId} -> JSON (TTL: 1小时)
```

#### MySQL

**用途**：存储聚合后的错误 Issue 和统计信息

**核心表**：
- `error_logs` - 错误日志表
- `error_issues` - 错误 Issue 表（聚合）
- `user_sessions` - 用户 Session 表
- `session_breadcrumbs` - 行为链路表
- `users` - 用户表
- `performance_logs` - 性能监控表

详见：`server/database/schema.sql`

---

### 监控平台前端

**技术栈**：原生 HTML + CSS + JavaScript

**核心页面**：
- `dashboard/ErrorDetailPage.html` - 错误详情页

**功能特性**：
- 📍 用户行为路径时间轴
- 🔍 错误堆栈展示
- 📄 页面状态快照
- 👤 Session 信息
- 💻 环境信息
- 📊 统计信息
- ✅ 错误处理操作（标记已解决/忽略）

---

## 部署指南

### 1. 前端 SDK 部署

```bash
# 安装依赖
npm install

# 构建 SDK
npm run build

# 在项目中引入
<script src="dist/webEyeSDK.min.js"></script>
```

### 2. 后端服务部署

```bash
# 进入 server 目录
cd server

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，配置数据库连接

# 初始化数据库
mysql -u root -p < database/schema.sql

# 启动服务
npm start
```

### 3. 数据库配置

#### Elasticsearch

```bash
# 启动 Elasticsearch
docker run -d \
  --name elasticsearch \
  -p 9200:9200 \
  -e "discovery.type=single-node" \
  elasticsearch:8.11.0
```

#### Redis

```bash
# 启动 Redis
docker run -d \
  --name redis \
  -p 6379:6379 \
  redis:7-alpine
```

#### MySQL

```bash
# 启动 MySQL
docker run -d \
  --name mysql \
  -p 3306:3306 \
  -e MYSQL_ROOT_PASSWORD=password \
  -e MYSQL_DATABASE=monitor_platform \
  mysql:8.0
```

### 4. 环境变量配置

创建 `server/.env` 文件：

```env
# 服务端口
PORT=3000

# Elasticsearch
ES_NODE=http://localhost:9200
ES_USERNAME=elastic
ES_PASSWORD=changeme

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# MySQL
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=password
MYSQL_DATABASE=monitor_platform
```

---

## 使用示例

### 基础使用

```html
<!DOCTYPE html>
<html>
<head>
  <title>示例页面</title>
  <script src="dist/webEyeSDK.min.js"></script>
</head>
<body>
  <script>
    // 1. 初始化 SDK
    webEyeSDK.init({
      url: 'https://your-api.com/api/error/report',
      projectKey: 'your-project-key',
      enableBehaviorTracking: true,
      enableErrorTracking: true,
      maxBreadcrumbs: 50,
      batchSize: 20,
    });

    // 2. 用户登录后设置用户信息
    function onUserLogin(user) {
      webEyeSDK.setUser(user.id, {
        username: user.name,
        email: user.email,
      });
    }

    // 3. 手动上报错误
    try {
      // 业务代码
      throw new Error('测试错误');
    } catch (error) {
      webEyeSDK.captureError(error, {
        context: 'payment',
        orderId: '12345',
      });
    }

    // 4. 手动添加面包屑
    webEyeSDK.addBreadcrumb({
      type: 'user',
      category: 'action',
      message: '用户点击了支付按钮',
      data: { amount: 100 },
    });

    // 5. 用户登出时清除
    function onUserLogout() {
      webEyeSDK.clearUser();
    }
  </script>
</body>
</html>
```

### Vue 项目使用

```javascript
// main.js
import Vue from 'vue';
import webEyeSDK from 'webEyeSDK';

Vue.use(webEyeSDK, {
  url: 'https://your-api.com/api/error/report',
  projectKey: 'your-project-key',
  enableBehaviorTracking: true,
  enableErrorTracking: true,
});

// 用户登录后
this.$webEyeSDK.setUser(user.id, user);
```

### React 项目使用

```javascript
// App.js
import React from 'react';
import webEyeSDK, { errorBoundary } from 'webEyeSDK';

// 初始化
webEyeSDK.init({
  url: 'https://your-api.com/api/error/report',
  projectKey: 'your-project-key',
});

// ErrorBoundary 组件
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    errorBoundary(error, errorInfo);
  }

  render() {
    return this.props.children;
  }
}

// 使用
function App() {
  return (
    <ErrorBoundary>
      <YourApp />
    </ErrorBoundary>
  );
}
```

---

## API 文档

### SDK API

#### `init(options)`

初始化 SDK

**参数**：
- `url` (string) - 上报地址
- `projectKey` (string) - 项目Key
- `enableBehaviorTracking` (boolean) - 是否启用行为追踪，默认 true
- `enableErrorTracking` (boolean) - 是否启用错误追踪，默认 true
- `enablePerformanceTracking` (boolean) - 是否启用性能监控，默认 false
- `maxBreadcrumbs` (number) - 最大面包屑数量，默认 50
- `batchSize` (number) - 批量上报数据条数，默认 20

#### `setUser(userId, userInfo)`

设置用户信息（用户登录后调用）

**参数**：
- `userId` (string) - 用户ID
- `userInfo` (object) - 用户信息

#### `clearUser()`

清除用户信息（用户登出时调用）

#### `captureError(error, extra)`

手动上报错误

**参数**：
- `error` (Error|string) - 错误对象或错误信息
- `extra` (object) - 额外信息

#### `addBreadcrumb(breadcrumb)`

手动添加面包屑

**参数**：
- `breadcrumb` (object) - 面包屑数据
  - `type` (string) - 类型
  - `category` (string) - 分类
  - `message` (string) - 描述
  - `data` (object) - 附加数据

#### `getSessionInfo()`

获取当前 Session 信息

**返回**：Session 对象

#### `getBreadcrumbs()`

获取行为链路

**返回**：Breadcrumb 数组

---

### 后端 API

#### `POST /api/error/report`

错误上报接口

**请求体**：
```json
{
  "errorId": "err-abc123",
  "type": "error",
  "subType": "js",
  "message": "TypeError: ...",
  "stack": "...",
  "session": { ... },
  "breadcrumbs": [ ... ],
  "pageState": { ... },
  "environment": { ... },
  "timestamp": 1733654415500
}
```

**响应**：
```json
{
  "success": true,
  "errorId": "err-abc123",
  "timestamp": 1733654415500
}
```

#### `GET /api/error/:errorId`

获取错误详情

**响应**：
```json
{
  "success": true,
  "data": { ... }
}
```

#### `GET /api/errors`

获取错误列表

**查询参数**：
- `page` (number) - 页码，默认 1
- `pageSize` (number) - 每页数量，默认 20
- `status` (string) - 状态筛选
- `type` (string) - 类型筛选

**响应**：
```json
{
  "success": true,
  "data": [ ... ],
  "total": 100,
  "page": 1,
  "pageSize": 20
}
```

---

## 数据流程图

```
用户操作
   ↓
BehaviorTracker 监听
   ↓
BreadcrumbManager 记录
   ↓
存储到 sessionStorage
   ↓
错误发生
   ↓
ErrorReporter 捕获
   ↓
获取完整上下文
   ├─ Session 信息
   ├─ Breadcrumb 链路
   ├─ 页面状态
   └─ 环境信息
   ↓
立即上报到后端
   ↓
后端接入层
   ├─ 数据验证清洗
   ├─ 生成堆栈哈希
   └─ 异步处理
       ├─ 存储到 ES（原始日志）
       ├─ 缓存到 Redis（Session）
       └─ 保存到 MySQL（聚合）
   ↓
监控平台查询
   ├─ 从 ES 获取详情
   ├─ 从 Redis 获取 Session
   └─ 从 MySQL 获取统计
   ↓
展示错误详情页
   ├─ 用户行为路径时间轴
   ├─ 错误堆栈
   ├─ Session 信息
   └─ 环境信息
```

---

## 性能优化

### 前端优化

1. **防抖/节流**
   - 输入事件：500ms 防抖
   - 滚动事件：2秒节流

2. **数据压缩**
   - Breadcrumb 限制最大数量（50条）
   - 字符串截断（message 1000字符，stack 5000字符）

3. **异步上报**
   - 使用 requestIdleCallback
   - 使用 sendBeacon（页面卸载时）

4. **存储优化**
   - sessionStorage 存储 Breadcrumb
   - localStorage 存储 Session
   - 自动清理过期数据

### 后端优化

1. **异步处理**
   - 立即返回响应
   - 异步写入数据库

2. **批量写入**
   - 批量插入 MySQL
   - 批量索引 ES

3. **缓存策略**
   - Redis 缓存 Session（30分钟）
   - Redis 缓存错误统计（1小时）

4. **索引优化**
   - ES 索引按月分片
   - MySQL 添加必要索引

---

## 常见问题

### Q1: 如何减少 SDK 对页面性能的影响？

A: SDK 已经做了大量优化：
- 使用防抖/节流减少事件监听频率
- 使用 requestIdleCallback 在空闲时上报
- Breadcrumb 限制最大数量
- 可以通过配置关闭不需要的功能

### Q2: 敏感信息会被上报吗？

A: 不会。SDK 会自动脱敏：
- 密码字段完全隐藏
- 邮箱/手机号部分隐藏
- 可以自定义脱敏规则

### Q3: 如何查看错误详情？

A: 打开监控平台的错误详情页：
```
http://your-domain/dashboard/ErrorDetailPage.html?errorId=xxx
```

### Q4: 数据保留多久？

A: 默认配置：
- ES 原始日志：90天
- MySQL 聚合数据：永久
- Redis 缓存：30分钟

可以通过定时任务清理：
```sql
CALL clean_old_data(90);
```

---

## 总结

本架构实现了从用户登录到报错的完整行为链路追踪，能够：

✅ 完整还原错误现场
✅ 快速定位问题根因
✅ 分析用户操作路径
✅ 统计错误影响范围
✅ 提升问题修复效率

通过 Session + Breadcrumb 机制，开发者可以像"回放录像"一样查看用户的操作过程，大大提升了问题排查的效率。
