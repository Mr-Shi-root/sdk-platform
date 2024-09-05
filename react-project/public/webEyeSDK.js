var WebEyeSDK = (function (exports) {
  'use strict';

  var config = {
    url: 'http://127.0.0.1:8080/api',
    projectName: 'xxxx',
    name: 'xxxx',
    id: '',
    isImageUpload: false,
    batchSize: 5 // 批量上报数据条数
  };

  // 暴露给外部可以初始化内部config数据
  function setConfig(options) {
    for (var key in options) {
      if (config.hasOwnProperty(key)) {
        config[key] = options[key];
      }
    }
  }

  function _arrayLikeToArray(r, a) {
    (null == a || a > r.length) && (a = r.length);
    for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
    return n;
  }
  function _createForOfIteratorHelper(r, e) {
    var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
    if (!t) {
      if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e) {
        t && (r = t);
        var n = 0,
          F = function () {};
        return {
          s: F,
          n: function () {
            return n >= r.length ? {
              done: !0
            } : {
              done: !1,
              value: r[n++]
            };
          },
          e: function (r) {
            throw r;
          },
          f: F
        };
      }
      throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }
    var o,
      a = !0,
      u = !1;
    return {
      s: function () {
        t = t.call(r);
      },
      n: function () {
        var r = t.next();
        return a = r.done, r;
      },
      e: function (r) {
        u = !0, o = r;
      },
      f: function () {
        try {
          a || null == t.return || t.return();
        } finally {
          if (u) throw o;
        }
      }
    };
  }
  function _defineProperty(e, r, t) {
    return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
      value: t,
      enumerable: !0,
      configurable: !0,
      writable: !0
    }) : e[r] = t, e;
  }
  function ownKeys(e, r) {
    var t = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var o = Object.getOwnPropertySymbols(e);
      r && (o = o.filter(function (r) {
        return Object.getOwnPropertyDescriptor(e, r).enumerable;
      })), t.push.apply(t, o);
    }
    return t;
  }
  function _objectSpread2(e) {
    for (var r = 1; r < arguments.length; r++) {
      var t = null != arguments[r] ? arguments[r] : {};
      r % 2 ? ownKeys(Object(t), !0).forEach(function (r) {
        _defineProperty(e, r, t[r]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {
        Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
      });
    }
    return e;
  }
  function _toPrimitive(t, r) {
    if ("object" != typeof t || !t) return t;
    var e = t[Symbol.toPrimitive];
    if (void 0 !== e) {
      var i = e.call(t, r || "default");
      if ("object" != typeof i) return i;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === r ? String : Number)(t);
  }
  function _toPropertyKey(t) {
    var i = _toPrimitive(t, "string");
    return "symbol" == typeof i ? i : i + "";
  }
  function _typeof(o) {
    "@babel/helpers - typeof";

    return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {
      return typeof o;
    } : function (o) {
      return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
    }, _typeof(o);
  }
  function _unsupportedIterableToArray(r, a) {
    if (r) {
      if ("string" == typeof r) return _arrayLikeToArray(r, a);
      var t = {}.toString.call(r).slice(8, -1);
      return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;
    }
  }

  function deepcopy(target) {
    if (_typeof(target) === 'object') {
      var result = Array.isArray(target) ? [] : {};
      for (var key in target) {
        if (_typeof(target[key]) == 'object') {
          result[key] = deepcopy(target[key]);
        } else {
          result[key] = target[key];
        }
      }
      return result;
    }
    return target;
  }

  var cache = [];
  function getCache() {
    return deepcopy(cache);
  }
  function addCache(data) {
    cache.push(data);
  }
  function clearCache() {
    cache.length = 0;
  }

  // 一般token生成，hash生成的格式，是36进制
  // 0至9和A至Z
  // Math.random().toString(36).substring(2, 9)

  var originalProto$1 = XMLHttpRequest.prototype;
  var originalSend$1 = originalProto$1.send;
  var originalOpen$1 = originalProto$1.open;
  function generateUniqueId$1() {
    return 'id-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
  }
  function report(data) {
    if (!config.url) {
      console.error('请设置上传 url 地址');
    }
    var reportData = JSON.stringify({
      id: generateUniqueId$1(),
      data: data
    });
    // 上报数据，使用图片的方式
    if (config.isImageUpload) {
      imgRequest(reportData);
    } else {
      // 优先使用 sendBeacon
      if (window.navigator.sendBeacon) {
        return beaconRequest(reportData);
      } else {
        xhrRequest();
      }
    }
  }

  //批量上传
  function lazyReportBatch(options) {
    // 缓存方法
    addCache(options);
    var data = getCache();
    console.log('lazyDataArr:', data);
    if ((data === null || data === void 0 ? void 0 : data.length) > config.batchSize) {
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

  function imgRequest(data) {
    console.log('imgRequest:');
    var img = new Image();
    img.src = "".concat(config.url, "?data=").concat(encodeURIComponent(JSON.stringify(data)));
  }

  // 普通ajax发送请求数据
  function xhrRequest(url, data) {
    console.log('xhrRequest:');
    if (window.requestIdleCallback) {
      return flag = window.requestIdleCallback(function () {
        var xhr = new XMLHttpRequest();
        originalOpen$1.call(xhr, 'POST', data.url, true);
        originalSend$1.call(xhr, JSON.stringify(data));
      }, {
        timeout: 3000
      });
    } else {
      setTimeout(function () {
        var xhr = new XMLHttpRequest();
        originalOpen$1.call(xhr, 'POST', data.url, true);
        originalSend$1.call(xhr, JSON.stringify(data));
      });
    }
    var xhr = new XMLHttpRequest();
    originalOpen$1.call(xhr, 'POST', data.url, true);
    originalSend$1.call(xhr, JSON.stringify(data));
  }

  // 
  // const sendBeacon = isSupportSendBeacon() ? navigator.sendBeacon : xhrRequest
  function beaconRequest(data) {
    console.log('beaconRequest:');
    if (window.requestIdleCallback) {
      window.requestIdleCallback(function () {
        window.navigator.sendBeacon(config.url, data);
      }, {
        timeout: 3000
      });
    } else {
      setTimeout(function () {
        window.navigator.sendBeacon(config.url, data);
      });
    }
  }

  // fetch 请求时长
  var originalFetch = window.fetch;

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
      var startTime = performance.now();
      var reportData = {
        type: 'performance',
        subType: 'fetch',
        pageUrl: window.location.href,
        startTime: startTime,
        endTime: null,
        duration: null,
        status: null,
        success: null,
        args: args
      };
      return originalFetch(url, config).then(function (res) {
        var endTime = performance.now();
        reportData.endTime = endTime;
        reportData.duration = endTime - startTime;
        var data = res.clone();
        // clone函数的主体只能被消耗一次，json和text都会消耗，使得函数无法再次使用，所以创建副本用来调用
        reportData.status = data.status;
        reportData.success = data.ok;
        // TODO 上报数据
        lazyReportBatch(reportData);
        return res;
      }).catch(function (err) {
        var endTime = performance.now();
        reportData.endTime = endTime;
        reportData.duration = endTime - startTime;
        reportData.status = 0;
        reportData.success = false;
        // TODO 上报数据
        lazyReportBatch(reportData);
      });
    };
  }
  function fetch() {
    overwriteFetch();
  }

  function observerEntries() {
    if (document.readyState == 'complete') {
      observerEvent();
    } else {
      var _onLoad = function onLoad() {
        observerEvent();
        window.removeEventListener('load', _onLoad);
      };
      window.addEventListener('load', _onLoad, true);
    }
  }

  // 统计所有静态资源的方法
  function observerEvent() {
    var entryHandle = function entryHandle(list) {
      var entries = list.getEntries();
      var _iterator = _createForOfIteratorHelper(entries),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var entry = _step.value;
          if (observer) {
            observer.disconnect();
          }
          // 需要上报的参数
          var reporData = {
            name: entry.name,
            type: 'performance',
            //类型
            subType: entry.entryType,
            // 类型
            pageUrl: entry.initiatorType,
            // 资源管理
            duration: entry.duration,
            //  耗时
            dns: entry.domainLookupEnd - entry.domainLookupStart,
            // dns解析时间
            tcp: entry.connectEnd - entry.connectStart,
            // tcp连接时间
            redirect: entry.redirectEnd - entry.redirectStart,
            // 重定向时间
            // TODO: 看下要不要减后面的requestStart
            ttfb: entry.responseStart - entry.requestStart,
            // 首字节时间
            protocol: entry.nextHopProtocol,
            // 协议
            responseBodySize: entry.transferSize,
            // 响应大小
            responseHeaderSize: entry.transferSize - entry.encodedBodySize,
            // 响应头大小
            transferSize: entry.transferSize,
            // 请求内容大小
            resourceSize: entry.decodedBodySize,
            // 响应内容大小(资源解压后的大小)
            startTime: performance.now()
          };
          // console.log(entry);
          // 发送数据进行上报
          lazyReportBatch(reporData);
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
    };
    var observer = new PerformanceObserver(entryHandle);
    observer.observe({
      type: ['resource'],
      buffered: true
    });
  }

  function observerLCP() {
    var entryHandle = function entryHandle(entries) {
      // console.log('entries:',entries);

      if (observer) {
        observer.disconnect();
      }
      var _iterator = _createForOfIteratorHelper(entries.getEntries()),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var entry = _step.value;
          var json = entry.toJSON();
          // console.log('json:',json);
          // console.log('element:', entry.element);

          // 需要上报的参数
          var reportData = _objectSpread2(_objectSpread2({}, json), {}, {
            type: 'performance',
            subType: entry.name,
            pageUrl: window.location.href
          });

          // 发送数据 todo
          lazyReportBatch(reportData);
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
    };
    // 统计和计算lcp的事件
    var observer = new PerformanceObserver(entryHandle);
    // buffer: true 确保观察到所有paint事件
    observer.observe({
      type: 'largest-contentful-paint',
      buffered: true
    });
  }

  function observerFCP() {
    var entryHandle = function entryHandle(entries) {
      console.log('entries:', entries);
      var _iterator = _createForOfIteratorHelper(entries.getEntries()),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var entry = _step.value;
          if (entry.name === 'first-contentful-paint') {
            observer.disconnect();
            var json = entry.toJSON();

            // 需要上报的参数
            var reportData = _objectSpread2(_objectSpread2({}, json), {}, {
              type: 'performance',
              subType: entry.name,
              pageUrl: window.location.href
            });

            // 发送数据 todo
            lazyReportBatch(reportData);
          }
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
    };
    // 统计和计算fcp的事件
    var observer = new PerformanceObserver(entryHandle);
    // buffer: true 确保观察到所有paint事件
    observer.observe({
      type: 'paint',
      buffered: true
    });
  }

  function observerLoad() {
    window.addEventListener('pageShow', function (e) {
      requestAnimationFrame(function () {
        ['load', 'DOMCotentLoaded'].forEach(function (type) {
          // console.log('test===', performance.now() - e.timeStamp, type);
          var reportData = {
            type: 'performance',
            subType: type,
            pageUrl: window.location.href,
            startTime: performance.now() - e.timeStamp
          };
          lazyReportBatch(reportData);
        });
      }, true);
    });
  }

  function observerPaint() {
    var entryHandle = function entryHandle(entries) {
      // console.log('entries:',entries.getEntries());
      var _iterator = _createForOfIteratorHelper(entries.getEntries()),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var entry = _step.value;
          if (entry.name === 'first-paint') {
            observer.disconnect();
            var json = entry.toJSON();

            // 需要上报的参数
            var reportData = _objectSpread2(_objectSpread2({}, json), {}, {
              type: 'performance',
              subType: entry.name,
              pageUrl: window.location.href
            });

            // 发送数据 todo
            lazyReportBatch(reportData);
          }
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
    };
    // 统计和计算fp的事件
    var observer = new PerformanceObserver(entryHandle);
    // buffer: true 确保观察到所有paint事件
    observer.observe({
      type: 'paint',
      buffered: true
    });
  }

  // 统计ajax的上报
  // 常用的ajax请求方式是axios，axios底层封装的就是xhr（XML HTML REQUEST）
  // 但是我们不能改变原来的ajax方法，所以要重写shr的方法

  var originalProto = XMLHttpRequest.prototype;
  var originalSend = originalProto.send;
  var originalOpen = originalProto.open;
  function overwriteOpenAndSend() {
    originalProto.open = function newOpen(args) {
      this.url = args[1];
      this.method = args[0];
      originalOpen.apply(this, args);
    };
    originalProto.send = function newSend(args) {
      var _this = this;
      this.startTime = Date.now();
      var _onLoaded = function onLoaded() {
        _this.endTime = Date.now();
        _this.duration = _this.endTime - _this.startTime;
        var url = _this.url,
          method = _this.method,
          startTime = _this.startTime,
          endTime = _this.endTime,
          duration = _this.duration,
          status = _this.status;
        var reportData = {
          type: 'performance',
          url: url,
          method: method,
          startTime: startTime,
          endTime: endTime,
          duration: duration,
          status: status,
          subType: 'xhr',
          success: status >= 200 && status < 300 // 如果是200或2开头的，可以认为是请求成功的
        };
        // console.log(reportData);

        // TODO 发送数据
        lazyReportBatch(reportData);
        _this.removeEventListener('loadend', _onLoaded, true);
      };
      // loaded 事件总是在一个资源的加载进度停止之后被触发（例如： 在已经出发”error”，“about”或“load“事件之后）。这是用于XMLHttpRequest调用
      this.addEventListener('loadend', _onLoaded, true);
      originalSend.apply(this, args);
    };
  }
  function xhr() {
    overwriteOpenAndSend();
  }

  function performance$1() {
    fetch();
    observerEntries();
    observerLCP();
    observerFCP();
    observerLoad();
    observerPaint();
    xhr();
  }

  // 错误异常信息的统计
  // 类型：
  //     JS原生错误：语法错误，运行时错误，逻辑错误
  // 除了try catch去捕获，我们还需要上报没有被捕获住的错误---通过error事件去
  // 

  function error() {
    // 捕获资源加载失败的错误： js css img
    window.addEventListener('error', function (event) {
      console.log('error event:', event);
      var target = event.target;
      // console.log('target:',target.src , target.href);
      // 非js css img资源加载的报错， 如果为null，可能是以下三种原因
      // js运行时错误：脚本执行中的错误。
      // 非 DOM 元素资源错误：如网络请求失败、AJAX 错误等。
      // 内存或系统级错误：如内存溢出等错误。
      if (!target) {
        return;
      }
      // src是处理img的src， href是js，css资源的href
      if (target.src || target.href) {
        var url = target.src || target.href;
        var reportData = {
          type: 'error',
          subType: 'resource',
          pageUrl: window.location.href,
          url: url,
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          html: target.outerHTML,
          paths: error.paths
        };
        // console.log('reportData:',reportData);
        // TODO 发送数据
        lazyReportBatch(reportData);
      }
    }, true);

    // 捕获js语法的一系列错误
    window.onerror = function (msg, url, lineNo, columnNo, error) {
      console.log('onerror:', msg, url, columnNo, error);
      var reportData = {
        type: 'error',
        subType: 'js',
        pageUrl: window.location.href,
        message: msg,
        url: url,
        columnNo: columnNo,
        lineNo: lineNo,
        error: error,
        paths: error.paths,
        stack: error.stack
      };
      // TODO 发送错误信息
      lazyReportBatch(reportData);
      // console.log('reportData:', reportData);
    };

    // 捕获promise的错误 async await
    window.addEventListener('unhandledrejection', function (event) {
      console.log('unhandledrejection event:', event);
      var reportData = {
        type: 'error',
        subType: 'promise',
        pageUrl: window.location.href,
        message: event.reason.message,
        stack: event.reason.stack
      };
      // TODO 发送错误信息
      lazyReportBatch(reportData);
      // console.log('reportData:', reportData);
    });

    // 记录错误的路径
    // error.paths = [];
    // window.addEventListener('popstate', function (event) {
    //     console.log('popstate event:', event);
    //     error.paths.push(window.location.pathname);
    // }, false);

    // 记录错误的路径
    // window.addEventListener('pushstate', function (event) {
    //     console.log('pushstate event:', event);
    //     error.paths.push(window.location.pathname);
    // }, false);
  }

  function click() {
    ['mousedown', 'touchstart'].forEach(function (eventType) {
      window.addEventListener(eventType, function (e) {
        var target = e.target;
        if (!target.tagName) {
          return;
        }
        var reportData = {
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
        };
        lazyReportBatch(reportData);
      });
    });
  }

  function generateUniqueId() {
    return 'id-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
  }

  function pageChange(data) {
    // hash history

    var oldUrl = '';
    window.addEventListener('hashchange', function (event) {
      var newUrl = window.location.href;
      var reportData = {
        from: oldUrl,
        to: newUrl,
        type: 'behavior',
        subType: 'hashchange',
        pageUrl: window.location.href,
        startTime: this.performance.now(),
        uuid: generateUniqueId()
      };
      lazyReportBatch(reportData);
      oldUrl = newUrl;
    }, true);

    // 点击后退前进的时间
    var from = '';
    window.addEventListener('poststate', function (event) {
      var to = window.location.href;
      var reportData = {
        from: from,
        to: to,
        type: 'behavior',
        subType: 'poststate',
        pageUrl: window.location.href,
        startTime: this.performance.now(),
        uuid: generateUniqueId()
      };
      lazyReportBatch(reportData);
      from = to;
    }, true);
  }

  function pv() {
    var reportData = {
      type: 'behavior',
      subType: 'pv',
      startTime: performance.now(),
      pageUrl: window.location.href,
      uid: generateUniqueId(),
      referrer: window.referrer
    };
    lazyReportBatch(reportData);
  }

  function behavior() {
    click();
    pageChange();
    pv();
  }

  window.__webEyeSDK__ = {
    version: '0.0.1'
  };

  // 针对vue 项目的错误上报
  function install(Vue, options) {
    // vue中app.use方法,默认调install方法,统计错误
    if (__webEyeSDK__.vue) return;
    __webEyeSDK__.vue = true;
    setConfig(options);
    var handler = Vue.config.errorHandler;
    // 重写vue的errorHandler方法，在errorHandler中上报错误信息，并执行原来的errorHandler方法
    Vue.config.errorHandler = function (err, vm, info) {
      var reportData = {
        error: err.stack,
        stack: info,
        timestamp: Date.now(),
        component: vm.$options.name || 'unknown',
        url: window.location.href,
        type: 'error',
        subType: 'Vue'
        // TODO 获取其他参数
      };
      console.log('vue installed error', reportData);
      // TODO 上报错误
      lazyReportBatch(reportData);
      if (handler) {
        handler.call(this, err, vm, info);
      }
    };
  }
  // 针对react项目的错误上报
  function errorBoundary(err, info) {
    console.log('react error');
    if (__webEyeSDK__.react) return;
    __webEyeSDK__.react = true;
    // TODO 上报错误
    var reportData = {
      error: err === null || err === void 0 ? void 0 : err.stack,
      info: info,
      timestamp: Date.now(),
      url: window.location.href,
      type: 'error',
      subType: 'React'
      // TODO 获取其他参数
    };
    // TODO 上报错误
    lazyReportBatch(reportData);
  }

  // init初始化定义config的参数
  function init(options) {
    setConfig(options);
    console.log('error:!!');
    // performance()
    error();
    // behavior() 
  }
  // webEyeSDK.init({
  //    url: 'xxxx',
  //    name: 'xxxx',
  //    id: '',
  //    isImageUpload: false,
  //    batchSize: 20, // 批量上报数据条数,
  // })

  var webEyeSDK = {
    init: init,
    install: install,
    errorBoundary: errorBoundary,
    performance: performance$1,
    error: error,
    behavior: behavior
  };

  exports.default = webEyeSDK;
  exports.errorBoundary = errorBoundary;
  exports.init = init;
  exports.install = install;

  Object.defineProperty(exports, '__esModule', { value: true });

  return exports;

})({});
