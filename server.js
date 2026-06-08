const { Telegraf } = require('telegraf');
const http = require('http');

// 1. Dummy Web Server to satisfy Render's port requirement
const PORT = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bot is running\n');
});
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Dummy server listening on port ${PORT}`);
});

// 2. Your Telegraf Bot Logic
console.log("Token length check:", process.env.BOT_TOKEN ? process.env.BOT_TOKEN.length : "UNDEFINED");

const bot = new Telegraf(process.env.BOT_TOKEN);
bot.start((ctx) => ctx.reply('Bot started!'));
bot.launch();

process.once('SIGINT', () => {
  bot.stop('SIGINT');
  server.close();
});
process.once('SIGTERM', () => {
  bot.stop('SIGTERM');
  server.close();
});
