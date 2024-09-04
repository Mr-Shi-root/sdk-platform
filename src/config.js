const config = {
    url: 'http://127.0.0.1:8080/api',
    projectName: 'xxxx',
    name: 'xxxx',
    id: '',
    isImageUpload: false,
    batchSize: 5, // 批量上报数据条数
}

// 暴露给外部可以初始化内部config数据
export function setConfig(options) {
    for (const key in options) {
        if (config.hasOwnProperty(key)) {
            config[key] = options[key];
        }
    }
}

export default config