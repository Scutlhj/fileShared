// client.js - 向服务端发送消息并通过 stdout 获取响应

import { spawn } from 'child_process';

// 启动 server.js 子进程
const serverProcess = spawn('node', ['server.js']);

// 监听服务端的响应
serverProcess.stdout.on('data', (data) => {
  console.log(data.toString());
});

// 发送几条测试消息
const messages = ['你好', '你是AI吗？', '再见！'];

messages.forEach((msg, index) => {
  setTimeout(() => {
    console.log(`-->${msg}`);
    serverProcess.stdin.write(msg);
  }, index * 1000); // 每秒发一条
});
