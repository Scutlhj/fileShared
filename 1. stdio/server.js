process.stdin.setEncoding('utf-8');

process.stdin.on('data', (data) => {
  data = data
    .replace(/[?？]/g, '')
    .replace(/我/g, '你')
    .replace(/你/g, '我')
    .replace(/吗/g, '');
  const resp = `回复：${data}\n`;
  process.stdout.write(resp);
});
