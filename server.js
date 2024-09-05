const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();

// Cors配置
// const corsOptions = {
//     origin: 'http://example.com', // 允许来自 http://example.com 的请求
//     methods: ['GET', 'POST'], // 只允许 GET 和 POST 请求
//     allowedHeaders: ['Content-Type', 'Authorization'] // 允许的请求头
// };
// app.use(cors(corsOptions));

//  Express 应用中的一个中间件函数，负责将请求中的各种类型数据解析为 JavaScript 对象，方便在路由处理函数中访问。
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(bodyParser.text());

// reportData接口，上报后进行请求，后续可用java数据库进行请求存储
app.post('/reportData', (req, res) => {
    console.log('server-reportData', req.body);
    res.status(200).send('success');
})

app.listen(3000, () => {
    console.log('server start at 3000');
}) 


