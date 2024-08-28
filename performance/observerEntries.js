
export default function observerEntries(){
    if (document.readyState == 'complete') {
        observerEvent()
    } else {
        const onLoad = () => {
            observerEvent()
            window.removeEventListener('load', onLoad)
        } 
        window.addEventListener('load', onLoad, true)
    }
}

// 统计所有静态资源的方法
export function observerEvent() {
    const entryHandle = (list) => {
        const entries = list.geteEntries();
        for (const entry of entries) {
            if(observer) {
                observer.disconnect();
            }
            // 需要上报的参数
            const reporData = {
                name: entry.name,
                type: 'performance', //类型
                subType: entry.entryType, // 类型
                pageUrl: entry.initiatorType, // 资源管理
                duration: entry.duration, //  耗时
                dns: entry.domainLookupEnd - entry.domainLookupStart, // dns解析时间
                tcp: entry.connectEnd - entry.connectStart, // tcp连接时间
                redirect: entry.redirectEnd - entry.redirectStart, // 重定向时间
                // TODO: 看下要不要减后面的requestStart
                ttfb: entry.responseStart - entry.requestStart, // 首字节时间
                protocol: entry.nextHopProtocol, // 协议
                responseBodySize: entry.transferSize, // 响应大小
                responseHeaderSize: entry.transferSize - entry.encodedBodySize, // 响应头大小
                transferSize: entry.transferSize, // 请求内容大小
                resourceSize: entry.decodedBodySize, // 响应内容大小(资源解压后的大小)
                startTime: performance.now(), 
            }
            console.log(entry);
            // 发送数据进行上报
        }
    }
    let observer = new PerformanceObserver(entryHandle)
    observer.observe({type: ['resource'], buffered: true})
}

/**
 * 
 * 
 */
function entryHandle(list) {
    const entries = list.geteEntries();
    for (const entry of entries) {
        console.log(entry);
    }
}
let observer = new PerformanceObserver(entryHandle)
observer.observe({type: ['resource'], buffered: true})