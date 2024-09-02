 window.__webEyeSDK__ = {
    version: '0.0.1',
 }

 // 针对vue 项目的错误上报
 export function install(Vue, options) {
    if(__webEyeSDK__.vue) return;
    __webEyeSDK__.vue = true;
    const handler = Vue.config.errorHandler;
    Vue.config.errorHandler = function(err, vm, info) {
        // TODO 上报错误
        if(handler) {
            handler(err, vm, info); 
        }
    }
 }
// 针对react项目的错误上报
 function errorBoundary(err) {
    if (__webEyeSDK__.react) return;
    __webEyeSDK__.react = true;
    // TODO 上报错误ee
 }

 export default {
    install,
    errorBoundary
 }