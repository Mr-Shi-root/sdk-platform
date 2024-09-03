import {lazyReportBatch} from "../report"
import {generateUniqueId} from "../utils"

export default function pageChange(data) {
    // hash history

    let oldUrl = ''
    window.addEventListener('hashchange', function(event) {
        const newUrl = window.location.href;
        const reportData = {
            from: oldUrl,
            to: newUrl,
            type: 'behavior',
            subType: 'hashchange',
            pageUrl: window.location.href,
            startTime: this.performance.now(),
            uuid: generateUniqueId(),
        }
        lazyReportBatch(reportData) 
        oldUrl = newUrl;
    }, true); 

    // 点击后退前进的时间
    let from = ''
    window.addEventListener('poststate', function(event) {
        const to = window.location.href;
        const reportData = {
            from,
            to,
            type: 'behavior',
            subType: 'poststate',
            pageUrl: window.location.href,
            startTime: this.performance.now(),
            uuid: generateUniqueId(),
        }
        lazyReportBatch(reportData) 
        from = to;
    }, true); 
} 