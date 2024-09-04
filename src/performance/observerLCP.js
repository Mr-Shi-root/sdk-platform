// 1.输出可见 type: 'largest-contentful-paint' 
// function entryHandle(entries) {
//     console.log('entries:',entries);
//   for (const entry of entries.getEntries()) {
//     console.log(entry.name, entry.startTime, entry.duration);
//   }
// }
import { lazyReportBatch } from "../report";
// 2.上报的api
function entryHandle(entries) {
    // console.log('entries:',entries);

    if (observer) {
        observer.disconnect();
    }
    
    for (const entry of entries.getEntries()) {
        const json = entry.toJSON();
        // console.log('json:',json);
        // console.log('element:', entry.element);
        
        // 需要上报的参数
        const reportData = {
            ...json,
            type: 'performance',
            subType: entry.name,
            pageUrl: window.location.href,
        }

        // 发送数据 todo
        lazyReportBatch(reportData) 
    }
}

// 统计和计算lcp的事件
const observer = new PerformanceObserver(entryHandle);
// buffer: true 确保观察到所有paint事件
observer.observe({type: 'largest-contentful-paint', buffered: true});

export default function observerLCP() {
    // 统计和计算lcp的事件
    const observer = new PerformanceObserver(entryHandle);
    // buffer: true 确保观察到所有paint事件
    observer.observe({type: 'largest-contentful-paint', buffered: true});
}