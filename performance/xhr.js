// 统计ajax的上报
// 常用的ajax请求方式是axios，axios底层封装的就是xhr（XML HTML REQUEST）
// 但是我们不能改变原来的ajax方法，所以要重写shr的方法

// axios底层使用xhr封装
// fetch底层就是fetch api

// 步骤 
// 1.在xhr的open初始化请求中，获取url和method参数
// 2.把参数原封不动赋给xhr.send（不能更改原函数的方法和参数，只是拦截获取信息）
// 3.在xhr的send发送请求中，监听loadend函数，在请求完成前后，获取时间差（请求时间）状态
// 3-1. 一定要记得remove监听事件，养成好的性能习惯
// 4.上报数据
export const originalProto = XMLHttpRequest.prototype;
export const originalSend = originalProto.send;
export const originalOpen = originalProto.open;

function overwriteOpenAndSend() {
    originalProto.open = function newOpen(args) {
        this.url = args[1];
        this.method = args[0];
        originalOpen.apply(this, args);
    }
    originalProto.send = function newSend(args) {
        this.startTime = Date.now();
        const onLoaded = () => {
            this.endTime = Date.now();
            this.duration = this.endTime - this.startTime;
            const { url, method, startTime, endTime, duration, status } = this
            const reportData = {
                type: 'performance',
                url,
                method,
                startTime,
                endTime,
                duration,
                status,
                subType: 'xhr',
                success: status >= 200 && status < 300, // 如果是200或2开头的，可以认为是请求成功的
            }
            console.log(reportData);

            // TODO 发送数据

            this.removeEventListener('loadend', onLoaded, true);
        }
        // loaded 事件总是在一个资源的加载进度停止之后被触发（例如： 在已经出发”error”，“about”或“load“事件之后）。这是用于XMLHttpRequest调用
        this.addEventListener('loadend', onLoaded, true);
        originalSend.apply(this, args);
    }
}

export default function xhr() {
    overwriteOpenAndSend();
}