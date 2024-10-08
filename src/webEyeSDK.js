import { lazyReportBatch } from "./report";
import performance from "./performance/index";
import error from "./error/index";
import behavior from "./behavior/index";
import {setConfig} from './config'

window.__webEyeSDK__ = {
    version: '0.0.1',
 }

 // 针对vue 项目的错误上报
export function install(Vue, options) {
   // vue中app.use方法,默认调install方法,统计错误
   if(__webEyeSDK__.vue) return;
   __webEyeSDK__.vue = true;
   setConfig(options)
   const handler = Vue.config.errorHandler;
   // 重写vue的errorHandler方法，在errorHandler中上报错误信息，并执行原来的errorHandler方法
   Vue.config.errorHandler = function(err, vm, info) {
      const reportData = {
         error: err.stack,
         stack: info,
         timestamp: Date.now(),
         component: vm.$options.name || 'unknown',
         url: window.location.href,
         type: 'error',
         subType: 'Vue'
         // TODO 获取其他参数
      }
      console.log('vue installed error', reportData);
      // TODO 上报错误
      lazyReportBatch(reportData) 
      if(handler) {
         handler.call(this, err, vm, info); 
      }
   }
}
// 针对react项目的错误上报
export function errorBoundary(err, info) {
   console.log('react error');
   if (__webEyeSDK__.react) return;
   __webEyeSDK__.react = true;
   // TODO 上报错误
   const reportData = {
      error: err?.stack,
      info,
      timestamp: Date.now(),
      url: window.location.href,
      type: 'error',
      subType: 'React'
      // TODO 获取其他参数
   }
   // TODO 上报错误
   lazyReportBatch(reportData) 
}

// init初始化定义config的参数
export function init(options) {
   setConfig(options)
   console.log('behavior:!!')
   // performance()
   // error()
   behavior() 
}
// webEyeSDK.init({
//    url: 'xxxx',
//    name: 'xxxx',
//    id: '',
//    isImageUpload: false,
//    batchSize: 20, // 批量上报数据条数,
// })

export default {
   init,
   install,
   errorBoundary,
   performance,
   error,
   behavior,
}