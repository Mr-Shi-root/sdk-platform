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

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(bodyParser.text());

app.post('/reportData', (req, res) => {
    console.log('server-reportData', req.body);
    res.status(200).send('success');
})

app.listen(3000, () => {
    console.log('server start at 3000');
}) 


