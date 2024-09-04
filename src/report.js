import config from './config'
import { addCache, clearCache, getCache } from './catch'
// 一般token生成，hash生成的格式，是36进制
// 0至9和A至Z
// Math.random().toString(36).substring(2, 9)

export const originalProto = XMLHttpRequest.prototype;
export const originalSend = originalProto.send;
export const originalOpen = originalProto.open;

export default function generateUniqueId() {
    return 'id-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9)
}

export function report(data) {
    if (!config.url) {
        console.error('请设置上传 url 地址');
    }

    const reportData = JSON.stringify({
        id: generateUniqueId(),
        data
    });
    // 上报数据，使用图片的方式
    if (config.isImageUpload) {
        imgRequest(reportData);
    } else {
        // 优先使用 sendBeacon
        if (window.navigator.sendBeacon) {
            return beaconRequest(reportData);
        } else {
            xhrRequest(reportData);
        }
    }
}

//批量上传
export function lazyReportBatch(options){// 缓存方法
    addCache(options);
    const data= getCache(options)
    console.log('lazyDataArr:', data);
    
    if(data?.length > config.batchSize){
        report(data);
        clearCache();
    } 
}

 
/**
 * 三种上报方式
 * 发送图片数据 
 * sendBeacon，如果不兼容，再使用图片上传
 * 普通ajax发送请求数据
 */


export function imgRequest(data) {
    console.log('imgRequest:');
    
    const img = new Image();
    img.src =  `${config.url}?data=${encodeURIComponent(JSON.stringify(data))}`;
}

// 普通ajax发送请求数据
export function xhrRequest(url, data) {
    console.log('xhrRequest:');
    
    if(window.requestIdleCallback){
        return flag = window.requestIdleCallback(()=>{
            const xhr = new XMLHttpRequest();
            originalOpen.call(xhr, 'POST', data.url, true);
            originalSend.call(xhr, JSON.stringify(data));
        },{ timeout: 3000 });
    } else {
        setTimeout(()=>{
            const xhr = new XMLHttpRequest();
            originalOpen.call(xhr, 'POST', data.url, true);
            originalSend.call(xhr, JSON.stringify(data));
        });
    }

    const xhr = new XMLHttpRequest();
    originalOpen.call(xhr, 'POST', data.url, true);
    originalSend.call(xhr, JSON.stringify(data));
}

// 
// const sendBeacon = isSupportSendBeacon() ? navigator.sendBeacon : xhrRequest
export function beaconRequest(data) {
    console.log('beaconRequest:');
    
    if (window.requestIdleCallback) {
        window.requestIdleCallback(
            () => {
                window.navigator.sendBeacon(config.url, data);
            },
            { timeout: 3000 }
        );
    } else {
        setTimeout(() => {
            window.navigator.sendBeacon(config.url, data);
        });
    }
}