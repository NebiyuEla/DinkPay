import TelegramBot from 'telegram-bot-api';
import User from './models/User.js';
import Order from './models/Order.js';

const bot = new TelegramBot({
  token: process.env.TELEGRAM_BOT_TOKEN
});

// Set webhook
export const setupWebhook = (url) => {
  bot.setWebhook(`${url}/webhook`).then(() => {
    console.log('✅ Telegram webhook set');
  });
};

// Handle messages
bot.on('message', async (message) => {
  const chatId = message.chat.id;
  const text = message.text;

  if (text === '/start') {
    bot.sendMessage(chatId, 
      'Welcome to Dink Pay! 🎉\n\n' +
      'Your premier digital payment service in Ethiopia.\n\n' +
      'Commands:\n' +
      '/orders - View your orders\n' +
      '/profile - View your profile\n' +
      '/help - Get help'
    );
  }

  if (text === '/orders') {
    // Find user by telegram ID
    const user = await User.findOne({ telegramId: chatId.toString() });
    if (!user) {
      return bot.sendMessage(chatId, 'Please login to the mini app first');
    }

    const orders = await Order.find({ user: user._id }).limit(5);
    
    if (orders.length === 0) {
      bot.sendMessage(chatId, 'You have no orders yet.');
    } else {
      let message = 'Your recent orders:\n\n';
      orders.forEach(order => {
        message += `• ${order.service.name} - ${order.plan.name}\n`;
        message += `  Status: ${order.status}\n`;
        message += `  Amount: ${order.amount} ETB\n\n`;
      });
      bot.sendMessage(chatId, message);
    }
  }
});

// Send notification to user
export const notifyUser = async (userId, title, message) => {
  const user = await User.findById(userId);
  if (user?.telegramId) {
    bot.sendMessage(user.telegramId, `🔔 *${title}*\n\n${message}`, {
      parse_mode: 'Markdown'
    });
  }
};

// Notify admin
export const notifyAdmin = async (message) => {
  const admins = await User.find({ isAdmin: true });
  admins.forEach(admin => {
    if (admin.telegramId) {
      bot.sendMessage(admin.telegramId, `👤 *Admin Alert*\n\n${message}`, {
        parse_mode: 'Markdown'
      });
    }
  });
};

export default bot;