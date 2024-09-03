// 埋点监控sdk设计
// 1.埋点监控系统负责处理那些问题，需要怎么设计api？
// 2.为什么用img的src做请求的发送，sendBeacon又是什么？
// 3.在react，vue的错误辩解中要怎么处理？

// 上报方法：
//     1.xhr
//     2.image gif，
//     3.sendBeacon
// 上报时机：
//     1.requestIdleCallback
//     2.setTimeout
//     3.beforeOnload
//     4.缓存批量

// 性能监控
//     1.FP，FCP，LCP，DomContentLoaded
//     2.静态资源的加载
//     3.ajax请求耗时

// 错误监控
//     1.资源加载错误
//     2.JavaSrcipt错误
//     3.promise async await错误

// 行为监控
//     1.pv uv
//     2.页面停留时间
//     3.用户行为click

