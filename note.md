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

