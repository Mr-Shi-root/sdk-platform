import {lazyReportBatch} from "../report"

export default function click() {
    ['mousedown', 'touchstart'].forEach(eventType => {
        window.addEventListener(eventType, e => {
            const target = e.target;
            if (!target.tagName) {
                return
            }
            const reportData = {
                type: 'behaviour',
                subType: 'click',
                pageUrl: window.location.href,
                target: target.tagName,
                clientX: e.clientX,
                clientY: e.clientY,
                startTime: e.timeStamp,
                innerHtml: target.innerHtml,
                outerHtml: target.outerHtml,
                width: target.offsetWidth,
                height: target.offsetHeight,
                path: e.path
            }
            lazyReportBatch(reportData) 
        })
    })
}