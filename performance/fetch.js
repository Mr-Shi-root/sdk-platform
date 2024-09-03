import { lazyReportBatch } from "../report";

// fetch 请求时长
const originalFetch = window.fetch();

// function overwriteFetch() {
//     window.fetch = async (...args) => {
//         const startTime = performance.now();
//         const response = await originalFetch(...args);
//         const endTime = performance.now();
//         const duration = endTime - startTime;

//         const reportData = {
//             type: 'performance',
//             subType: 'fetch',
//             pageUrl: window.location.href,
//             startTime,
//             endTime,
//             duration,
//             status: response.status,
//             success: response.ok,
//         }

//         // 上报数据 todo

//         return response;
//     }
// }

// 另一种写法
function overwriteFetch() {
    window.fetch = function newFetch(url, config) {
        const startTime = performance.now();
        const reportData = {
            type: 'performance',
            subType: 'fetch',
            pageUrl: window.location.href,
            startTime,
            endTime: null,
            duration: null,
            status: null,
            success: null,
            args,
        }
        return originalFetch(url, config)
        .then(res => {
            const endTime = performance.now();
            reportData.endTime = endTime;
            reportData.duration = endTime - startTime;
            const data = res.clone()
            reportData.status = data.status;
            reportData.success = data.ok;
            // TODO 上报数据
            lazyReportBatch(reportData) 

            return res;
        }).catch((err) => {
            const endTime = performance.now();
            reportData.endTime = endTime;
            reportData.duration = endTime - startTime;
            reportData.status = 0;
            reportData.success = false;
            // TODO 上报数据
            lazyReportBatch(reportData) 
        })
    }
}

export default function fetch() {
    overwriteFetch();
}
 