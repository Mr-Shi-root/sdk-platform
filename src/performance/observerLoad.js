import { lazyReportBatch } from "../report";
export default function observerLoad() {
    window.addEventListener('pageShow', function(e) {
        requestAnimationFrame(() => {
            ['load', 'DOMCotentLoaded'].forEach((type) => {
                // console.log('test===', performance.now() - e.timeStamp, type);
                const reportData = {
                    type: 'performance',
                    subType: type,
                    pageUrl: window.location.href,
                    startTime: performance.now() - e.timeStamp,
                }
                lazyReportBatch(reportData)
            })
        }, true); 
    })
 }