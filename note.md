监控平台

监测网页加载时长是关注的是以下5个过程：
    1.重定向时间：获取此网页前重定向所花费的时间
    2.DNS域名查找时间：查找此网页的DNS所花费的时间
    3.TCP服务器连接时间：用户连接到您的服务器所需的时间
    4.服务器响应时间：您的服务器响应用户请求所需的时间，其中爆哭哟从用户所在位置连接到您的服务器所需的网络时间
    5.网页下载时间：下载网页所需的时间

访问单页面经历的阶段
    1.页面准备阶段 cache dns解析 tcp连接 ssl证书
    2.页面加载阶段 html解析 css解析 js解析
    3.页面渲染阶段 dom渲染 css渲染
    4.页面交互阶段 js执行

性能指标
    FP(First Paint)首次绘制：页面开始绘制的时间，包括任何文本、图像（包括背景图片）、非白色的canvas和svg元素
    FCP(First Contentful Paint)首次内容绘制：浏览器将第一个DOM元素绘制到屏幕上的时间
    LCP(Largest Contentful Paint)最大内容绘制：最大内容元素（文本、图片、视频等）加载并渲染到屏幕上的时间
    FID(First Input Delay)首次输入延迟：用户首次与页面交互（例如点击链接、按钮等）到浏览器实际能够响应该交互的时间
    CLS(Cumulative Layout Shift)累计布局偏移：测量整个页面生命周期内发生的所有意外布局偏移的度量值
    TTI(Time to Interactive)可交互时间：页面完全加载并可以开始响应用户交互的时间
    LCP(Largest Contentful Paint)最大内容绘制：最大内容元素（文本、图片、视频等）加载并渲染到屏幕上的时间
    TBT(Total Blocking Time)总阻塞时间：测量主线程在首次内容绘制之前被阻塞的总时间
    FMP(First Meaningful Paint)首次有意义绘制：页面主要内容加载并渲染到屏幕上的时间
    TTFB(Time To First Byte)首字节时间：浏览器从服务器接收到第一个字节的时间


web-vitals 第三方库 能够自动统计页面各阶段加载时间 FP FCP CLS LP等等
    使用方法：


PerformanceObserver性能监测对象 
    PerformanceObserver 用于监测性能度量事件，在浏览器的性能时间轴记录新的 performance entry 的时候将会被通知。

补充知识点：
load和loadend区别
load：
定义：load 事件在资源（如图片、脚本、样式表、文档等）完全加载并可用时触发。对于文档对象，这个事件在整个页面及其所有子资源（如图像和iframe）完全加载后触发。
应用场景：你可以在 load 事件中执行操作，如初始化应用程序，或在页面完全加载后执行脚本。
触发条件：当所有依赖的资源（包括子资源）都加载完成时触发。
事件示例：
window.addEventListener('load', () => {
  console.log('Page and all resources have finished loading.');
});

loadend：
定义：loadend 事件是 XMLHttpRequest 和 Fetch API 的一部分，它在网络请求（包括成功和失败）完成时触发。对于 XMLHttpRequest，它在请求的状态变化到 DONE（readyState 为 4）时触发。
应用场景：可以用来处理请求完成后的清理操作或最终处理，例如隐藏加载指示器或更新用户界面。
触发条件：在网络请求完成时，无论请求是成功还是失败，都触发 loadend 事件。
事件示例：
const xhr = new XMLHttpRequest();
xhr.open('GET', 'https://api.example.com/data');
xhr.onloadend = () => {
  console.log('Request has completed.');
};
xhr.send();

总结
load 事件主要用于处理资源（如网页、图片等）完全加载后的操作。
loadend 事件用于处理网络请求的完成（包括成功或失败），通常与 XMLHttpRequest 和 Fetch API 一起使用。
两者的主要区别在于触发时机和应用场景，load 主要用于网页和资源的加载完成，而 loadend 主要用于网络请求的结束处理。

/**
 * 额外知识点：
 * 捕获错误的方式
 * 1.try catch (它不能捕获异步的错误，如，setTimeout中的error事件，不能走catch，可以用async await解决)
 * 2.window.onerror（可以捕获同步｜异步的错误，但是捕获不了js加载，图片加载，或者网络的错误 ）
 * 3.window.addEventListener('error', function) （不能避免promise的方法，因为promise的错误捕获，通过点catch）
 * 解决方法
 * 对于promise的错误，可以通过 window.addEventListener("unhandledrejection", function (event) {})
 */ 

/**
 * 总结：
 * 1.用window.addEventListener('error', ...) 去捕获 js，css，img资源加载失败的错误
 * 2.用window.onerror 捕获js错误
 * 3.用unhandledrejection 捕获promise的错误
 */
