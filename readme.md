# 🔍 WebEye SDK - 前端监控平台

> 完整的错误行为路径还原全链路架构 - 从用户登录到报错的完整追踪

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/your-repo)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## ✨ 核心特性

- 🎯 **Session 管理** - 追踪用户完整会话生命周期
- 📍 **Breadcrumb 面包屑** - 记录用户所有操作行为
- 🔄 **完整上下文上报** - 错误发生时附带完整环境信息
- 🎬 **行为路径还原** - 可视化展示用户操作时间轴
- 📊 **错误聚合分析** - 自动聚合相同错误，统计影响范围
- 🚀 **多平台支持** - 支持 Vue、React、原生 JS

## 🏗️ 整体架构

```
前端 SDK → 数据上报 → 接入层 → 存储层 → 监控平台
   ↓          ↓         ↓        ↓         ↓
Session   实时/批量   验证清洗   ES/Redis  错误详情页
Breadcrumb  上报     错误聚合   MySQL    行为时间轴
```

### 架构设计理念

**内核 + 插件** 的插件式设计：
- **内核**：数据上报、格式化、配置初始化等平台无关的基础逻辑
- **插件**：错误监控、性能监控、用户行为追踪等可插拔功能

**优势**：
- ✅ **拓展性**：插件使用与否不影响 SDK 运行，不会对业务本身产生影响
- ✅ **定制化**：自由决定启用哪些功能，哪个监控启用或不启用
- ✅ **可维护**：模块化设计，职责清晰

**大致流程**：在应用层 SDK 上报的数据，在接入层经过削峰限流、数据清洗和数据加工后，将原始日志存储于 ES 中，再经过数据聚合后，将 issue（聚合的数据）持久化存储于 MySQL，最后提供 RESTful API 供监控平台调用。

## 📦 项目结构

```
sdk-platform/
├── src/                          # 前端 SDK 源码
│   ├── session/                  # Session 管理模块
│   │   └── SessionManager.js     # Session 生命周期管理
│   ├── breadcrumb/               # Breadcrumb 面包屑模块
│   │   └── BreadcrumbManager.js  # 行为链路记录
│   ├── tracker/                  # 行为追踪模块
│   │   └── BehaviorTracker.js    # 自动监听用户操作
│   ├── error/                    # 错误监控模块
│   │   ├── index.js              # 原有错误捕获
│   │   └── ErrorReporter.js      # 增强错误上报器
│   ├── performance/              # 性能监控模块
│   ├── behavior/                 # 用户行为模块
│   ├── webEyeSDK.js             # SDK 主入口
│   ├── report.js                # 数据上报
│   ├── config.js                # 配置管理
│   └── utils.js                 # 工具函数
│
├── server/                       # 后端服务
│   ├── app.js                   # Express 服务器
│   ├── services/                # 数据服务
│   │   ├── elasticsearch.js     # ES 存储服务
│   │   ├── redis.js             # Redis 缓存服务
│   │   └── mysql.js             # MySQL 数据库服务
│   ├── utils/                   # 工具类
│   │   ├── validator.js         # 数据验证清洗
│   │   └── hash.js              # 错误哈希生成
│   └── database/                # 数据库
│       └── schema.sql           # MySQL 表结构
│
├── dashboard/                    # 监控平台前端
│   └── ErrorDetailPage.html    # 错误详情页
│
├── examples/                     # 使用示例
│   └── demo.html                # 演示页面
│
├── ARCHITECTURE.md              # 架构文档
└── readme.md                    # 本文件
```

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 初始化数据库

```bash
# 启动 MySQL
docker run -d --name mysql -p 3306:3306 \
  -e MYSQL_ROOT_PASSWORD=password \
  -e MYSQL_DATABASE=monitor_platform \
  mysql:8.0

# 导入表结构
mysql -u root -p < server/database/schema.sql
```

### 3. 启动后端服务

```bash
cd server
npm install
npm start
```

### 4. 在前端项目中使用

```html
<!DOCTYPE html>
<html>
<head>
  <script src="dist/webEyeSDK.min.js"></script>
</head>
<body>
  <script>
    // 初始化 SDK
    webEyeSDK.init({
      url: 'http://localhost:3000/api/error/report',
      projectKey: 'your-project-key',
      enableBehaviorTracking: true,
      enableErrorTracking: true,
    });

    // 用户登录后设置用户信息
    webEyeSDK.setUser('user-123', {
      username: '张三',
      email: 'zhangsan@example.com',
    });
  </script>
</body>
</html>
```

### 5. 查看演示

打开 `examples/demo.html` 体验完整功能。

## 📖 使用文档

### 基础使用

```javascript
// 1. 初始化
webEyeSDK.init({
  url: 'https://your-api.com/api/error/report',
  projectKey: 'your-project-key',
  enableBehaviorTracking: true,    // 启用行为追踪
  enableErrorTracking: true,       // 启用错误追踪
  enablePerformanceTracking: false, // 启用性能监控
  maxBreadcrumbs: 50,              // 最大面包屑数量
  batchSize: 20,                   // 批量上报数据条数
});

// 2. 设置用户（登录后）
webEyeSDK.setUser('user-123', {
  username: '张三',
  email: 'zhangsan@example.com',
});

// 3. 手动上报错误
try {
  // 业务代码
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

// 5. 清除用户（登出时）
webEyeSDK.clearUser();
```

### Vue 项目使用

```javascript
// main.js
import Vue from 'vue';
import webEyeSDK from 'webEyeSDK';

Vue.use(webEyeSDK, {
  url: 'https://your-api.com/api/error/report',
  projectKey: 'your-project-key',
});
```

### React 项目使用

```javascript
// App.js
import React from 'react';
import webEyeSDK, { errorBoundary } from 'webEyeSDK';

webEyeSDK.init({
  url: 'https://your-api.com/api/error/report',
  projectKey: 'your-project-key',
});

class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    errorBoundary(error, errorInfo);
  }
  render() {
    return this.props.children;
  }
}
```

## 🎯 核心功能详解

### 1. Session 管理

追踪用户从进入网站到离开的完整会话：

- 自动生成唯一 Session ID
- 支持匿名用户和登录用户
- Session 持久化（localStorage）
- 自动过期机制（30分钟）
- 记录页面浏览次数、错误次数

### 2. Breadcrumb 面包屑

记录用户的所有操作行为：

- 🌐 **Navigation** - 页面访问、路由跳转
- 👆 **User** - 点击、输入、滚动
- 🌐 **HTTP** - Ajax/Fetch 请求
- 📝 **Console** - 控制台日志
- ❌ **Error** - 错误发生

### 3. 错误上报

捕获所有类型的错误并附带完整上下文：

- JS 错误（语法错误、运行时错误）
- 资源加载错误（JS/CSS/图片）
- Promise 错误（unhandledrejection）
- Vue/React 框架错误
- 自定义错误

**上报的数据包含**：
- 错误基本信息（message、stack）
- Session 上下文（用户信息、设备信息）
- 完整行为链路（错误发生前的所有操作）
- 页面状态（URL、滚动位置、可见性）
- 环境信息（浏览器、操作系统、分辨率）

### 4. 监控平台

可视化展示错误详情：

- 📍 用户行为路径时间轴
- 🔍 错误堆栈信息
- 📄 页面状态快照
- 👤 Session 信息
- 💻 环境信息
- 📊 统计信息（发生次数、影响用户）

## 🗄️ 数据流程

```
用户操作
   ↓
BehaviorTracker 自动监听
   ↓
BreadcrumbManager 记录到面包屑
   ↓
存储到 sessionStorage
   ↓
错误发生
   ↓
ErrorReporter 捕获错误
   ↓
获取完整上下文
   ├─ Session 信息
   ├─ Breadcrumb 链路（错误前30条）
   ├─ 页面状态
   └─ 环境信息
   ↓
立即上报到后端
   ↓
后端接入层处理
   ├─ 数据验证清洗
   ├─ 生成堆栈哈希
   └─ 异步存储
       ├─ Elasticsearch（原始日志）
       ├─ Redis（Session 缓存）
       └─ MySQL（聚合数据）
   ↓
监控平台查询展示
   └─ 完整还原错误现场
```

## 📊 技术栈

### 前端 SDK
- 原生 JavaScript (ES6+)
- 单例模式、观察者模式、代理模式

### 后端服务
- Node.js + Express
- Elasticsearch（日志存储）
- Redis（缓存）
- MySQL（聚合数据）

### 监控平台
- 原生 HTML + CSS + JavaScript
- 响应式设计

## 🎨 错误详情页预览

打开 `dashboard/ErrorDetailPage.html` 查看完整的错误详情页，包括：

- ✅ 错误基本信息（类型、消息、发生时间、影响范围）
- ✅ 用户行为路径时间轴（可视化展示用户操作）
- ✅ 错误堆栈信息（支持复制）
- ✅ Session 信息（用户ID、Session时长、浏览次数）
- ✅ 页面状态（URL、标题、滚动位置）
- ✅ 环境信息（浏览器、操作系统、分辨率）
- ✅ 操作按钮（标记已解决、忽略）

## 📚 完整文档

详细的架构设计和实现文档请查看：[ARCHITECTURE.md](ARCHITECTURE.md)

## ❓ 常见问题

### Q1: 如何减少 SDK 对页面性能的影响？

SDK 已经做了大量优化：
- 使用防抖/节流减少事件监听频率
- 使用 requestIdleCallback 在空闲时上报
- Breadcrumb 限制最大数量
- 可以通过配置关闭不需要的功能

### Q2: 敏感信息会被上报吗？

不会。SDK 会自动脱敏：
- 密码字段完全隐藏
- 邮箱/手机号部分隐藏
- 可以自定义脱敏规则

### Q3: 数据保留多久？

默认配置：
- ES 原始日志：90天
- MySQL 聚合数据：永久
- Redis 缓存：30分钟

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 License

MIT License

---

## 💡 问题解答

### 问题1: 前端怎么将原始日志存储于ES中？

**答**：前端不直接存储到 ES，而是通过以下流程：

1. **前端 SDK 捕获数据**：ErrorReporter 捕获错误和完整上下文
2. **HTTP 上报到后端**：通过 `POST /api/error/report` 接口上报
3. **后端接入层接收**：Express 服务器接收并验证数据
4. **存储到 Elasticsearch**：后端调用 ES Node.js 客户端进行索引和存储

```javascript
// 前端上报
report(errorData);  // 使用 sendBeacon 或 XHR

// 后端接收并存储
app.post('/api/error/report', async (req, res) => {
  const errorData = req.body;
  await saveToElasticsearch(errorData);  // 存储到 ES
  res.json({ success: true });
});
```

### 问题2: 前端怎么进行数据聚合？大致思路是什么样的？

**答**：数据聚合在**后端**完成，流程如下：

1. **生成堆栈哈希**：后端接收错误后，根据 stack 生成唯一哈希值（stackHash）
   ```javascript
   stackHash = md5(cleanStack(error.stack));
   ```

2. **查询是否存在相同 Issue**：根据 stackHash 查询 MySQL
   ```sql
   SELECT * FROM error_issues WHERE stack_hash = ?
   ```

3. **更新或创建 Issue**：
   - **存在**：更新发生次数、影响用户数、最近发生时间
   - **不存在**：创建新的 Issue 记录

4. **统计影响范围**：
   ```sql
   SELECT COUNT(DISTINCT user_id) FROM error_logs WHERE stack_hash = ?
   ```

5. **前端查询聚合数据**：监控平台查询 MySQL 中的 Issue 数据展示

**优势**：
- ✅ 相同错误自动聚合，避免重复
- ✅ 统计发生次数和影响用户数
- ✅ 方便错误优先级排序和处理

详细实现见：`server/services/mysql.js` 中的 `updateErrorIssue` 函数
