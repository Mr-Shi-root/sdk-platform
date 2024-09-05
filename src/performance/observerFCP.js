// 1.输出可见 type: 'paint' 里有fp和fcp的统计时间
// function entryHandle(entries) {
//     console.log('entries:',entries);
//   for (const entry of entries.getEntries()) {
//     console.log(entry.name, entry.startTime, entry.duration);
//   }
// }
import { lazyReportBatch } from "../report";

export default function observerFCP() {

  const entryHandle = (entries) => {
    console.log('entries:',entries);
    
    for (const entry of entries.getEntries()) {
      if (entry.name === 'first-contentful-paint') {
          observer.disconnect();
          const json = entry.toJSON();

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
  }
  // 统计和计算fcp的事件
  const observer = new PerformanceObserver(entryHandle);
  // buffer: true 确保观察到所有paint事件
  observer.observe({type: 'paint', buffered: true});
}