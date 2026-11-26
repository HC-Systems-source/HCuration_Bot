require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { redeployService, restartService, getLatestDeploymentStatus } = require('./railway');

const token = process.env.TELEGRAM_BOT_TOKEN;
const allowedUserId = String(process.env.ALLOWED_USER_ID || '');

if (!token) {
  console.error('Missing TELEGRAM_BOT_TOKEN in .env');
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

function isAuthorized(msg) {
  return allowedUserId && String(msg.from.id) === allowedUserId;
}

function reject(chatId) {
  bot.sendMessage(chatId, 'Hindi ka authorized na gamitin ang bot na ito.');
}

bot.onText(/^\/start$/, (msg) => {
  if (!isAuthorized(msg)) return reject(msg.chat.id);
  bot.sendMessage(
    msg.chat.id,
    'Railway control bot ready.\n\nCommands:\n/status - latest deployment status\n/redeploy - trigger a redeploy\n/restart - restart the service'
  );
});

bot.onText(/^\/status$/, async (msg) => {
  if (!isAuthorized(msg)) return reject(msg.chat.id);
  const chatId = msg.chat.id;
  try {
    const deployment = await getLatestDeploymentStatus();
    if (!deployment) {
      return bot.sendMessage(chatId, 'Walang nahanap na deployment.');
    }
    bot.sendMessage(
      chatId,
      `Status: ${deployment.status}\nCreated: ${deployment.createdAt}\nURL: ${deployment.staticUrl || 'n/a'}`
    );
  } catch (err) {
    bot.sendMessage(chatId, `Error: ${err.message}`);
  }
});

bot.onText(/^\/redeploy$/, async (msg) => {
  if (!isAuthorized(msg)) return reject(msg.chat.id);
  const chatId = msg.chat.id;
  try {
    bot.sendMessage(chatId, 'Nagredeploy na...');
    await redeployService();
    bot.sendMessage(chatId, 'Redeploy triggered successfully.');
  } catch (err) {
    bot.sendMessage(chatId, `Error: ${err.message}`);
  }
});

bot.onText(/^\/restart$/, async (msg) => {
  if (!isAuthorized(msg)) return reject(msg.chat.id);
  const chatId = msg.chat.id;
  try {
    bot.sendMessage(chatId, 'Nagrestart na...');
    await restartService();
    bot.sendMessage(chatId, 'Restart triggered successfully.');
  } catch (err) {
    bot.sendMessage(chatId, `Error: ${err.message}`);
  }
});

bot.on('polling_error', (err) => {
  console.error('Polling error:', err.message);
});

console.log('Bot is running...');
