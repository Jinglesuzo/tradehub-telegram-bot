const { Telegraf } = require('telegraf');
const http = require('http');

const PORT = process.env.PORT || 10000; 
const HOST = '0.0.0.0';

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('TradeHub Telegram Bot is Online\n');
});

server.listen(PORT, HOST, () => {
  console.log(`Web server successfully bound to ${HOST}:${PORT}`);
});

console.log("Token length check:", process.env.BOT_TOKEN ? process.env.BOT_TOKEN.length : "UNDEFINED");

if (!process.env.BOT_TOKEN) {
  console.error("FATAL ERROR: BOT_TOKEN is missing in Render environment variables!");
  process.exit(1);
}

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => ctx.reply('Bot started!'));

bot.catch((err, ctx) => {
  console.error(`Telegraf error for ${ctx.updateType}:`, err);
});

bot.launch()
  .then(() => console.log('Telegram Bot successfully connected to Telegram API!'))
  .catch((err) => console.error('Failed to launch Telegram Bot:', err));

process.once('SIGINT', () => {
  bot.stop('SIGINT');
  server.close();
});
process.once('SIGTERM', () => {
  bot.stop('SIGTERM');
  server.close();
});
