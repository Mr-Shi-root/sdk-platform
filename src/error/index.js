// 错误异常信息的统计
// 类型：
//     JS原生错误：语法错误，运行时错误，逻辑错误
// 除了try catch去捕获，我们还需要上报没有被捕获住的错误---通过error事件去
// 

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

import { lazyReportBatch } from "../report";

 export default function error() {
    // 捕获资源加载失败的错误： js css img
    window.addEventListener('error', function (event) {
        console.log('error event:', event);
        const target = event.target;
        // console.log('target:',target.src , target.href);
        // 非js css img资源加载的报错， 如果为null，可能是以下三种原因
        // js运行时错误：脚本执行中的错误。
        // 非 DOM 元素资源错误：如网络请求失败、AJAX 错误等。
        // 内存或系统级错误：如内存溢出等错误。
        if (!target) {
            return;
        }
        // src是处理img的src， href是js，css资源的href
        if (target.src || target.href) {
            const url = target.src || target.href;
            const reportData = {
                type: 'error',
                subType: 'resource',
                pageUrl: window.location.href,
                url,
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                html: target.outerHTML,
                paths: error.paths
            }
            // console.log('reportData:',reportData);
            // TODO 发送数据
            lazyReportBatch(reportData) 
        }
    }, true);

    // 捕获js语法的一系列错误
    window.onerror = function (msg, url, lineNo, columnNo, error) {
        console.log('onerror:', msg, url, columnNo, error);
        const reportData = {
            type: 'error',
            subType: 'js',
            pageUrl: window.location.href,
            message: msg,
            url,
            columnNo,
            lineNo,
            error,
            paths: error.paths,
            stack: error.stack,
        }
        // TODO 发送错误信息
        lazyReportBatch(reportData) 
        // console.log('reportData:', reportData);
    }

    // 捕获promise的错误 async await
    window.addEventListener('unhandledrejection', function (event) {
        console.log('unhandledrejection event:', event);
        const reportData = {
            type: 'error',
            subType: 'promise',
            pageUrl: window.location.href,
            message: event.reason.message,
            stack: event.reason.stack,
        }
        // TODO 发送错误信息
        lazyReportBatch(reportData) 
        // console.log('reportData:', reportData);
    });

    // 记录错误的路径
    // error.paths = [];
    // window.addEventListener('popstate', function (event) {
    //     console.log('popstate event:', event);
    //     error.paths.push(window.location.pathname);
    // }, false);

    // 记录错误的路径
    // window.addEventListener('pushstate', function (event) {
    //     console.log('pushstate event:', event);
    //     error.paths.push(window.location.pathname);
    // }, false);
 }