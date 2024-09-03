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
    if (!config.report) {
        console.error('请设置上传 url 地址');
    }

    const reportData = JSON.stringify({
        id: generateUniqueId(),
        data
    });
    // TODO 发送数据 优先使用 secdBeacon，如果不兼容，再使用图片上传4
    lazyReportBatch(reportData) 
    const value = beaconRequest(config.url, reporData)
    if (!value) {
        // 上报数据，使用图片的方式
        config.isImageUpload ? imgRequest(reporData) : xhrRequest(config.url, reporData); 
    }
}

//批量上传
export function lazyReportBatch(options){// 缓存方法
    addCache(options);
    const data= getCache(options)
    if(data?.length > config.batchSize){
        report(data);clearCache();
    }
}

 
/**
 * 三种上报方式
 * 发送图片数据 
 * sendBeacon，如果不兼容，再使用图片上传
 * 普通ajax发送请求数据
 */


export function imgRequest(data) {
    const img = new Image();
    img.src =  `${config.url}?data=${encodeURIComponent(JSON.stringify(data))}`;
}

// 普通ajax发送请求数据
export function xhrRequest(url, data) {
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

// sendBeacon
export function isSupportSendBeacon(){
    return 'sendBeacon' in navigator;
}
const sendBeacon = isSupportSendBeacon()? navigator.sendBeacon: xhrRequest
// beacon发送请求数据(存在兼容性)
export function beaconRequest(data){
    let flag = true
    if(window.requestIdleCallback){
        window.requestIdleCallback(()=>{
            return flag = sendBeacon(config.url ,data);
        },{ timeout: 3000 });
    } else {
        setTimeout(()=>{
            return flag = sendBeacon(config.url, data)
        });
    }

}