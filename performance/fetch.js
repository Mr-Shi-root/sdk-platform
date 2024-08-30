// fetch 请求时长
const originalFetch = window.fetch();

function overwriteFetch() {
    window.fetch = async (...args) => {
        const startTime = performance.now();
        const response = await originalFetch(...args);
        const endTime = performance.now();
        const duration = endTime - startTime;

        const reportData = {
            type: 'performance',
            subType: 'fetch',
            pageUrl: window.location.href,
            startTime,
            endTime,
            duration,
        }

        // 上报数据 todo

        return response;
    }
}

