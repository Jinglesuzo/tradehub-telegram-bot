const express = require('express');
const cors = require('cors');
const { Telegraf } = require('telegraf');

const app = express();
app.use(cors());
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN || '8628012079:AAHWLsBa7mZwomiPLFZstNrMFomXjQMOjIs';
const bot = new Telegraf(BOT_TOKEN);

const otpStore = new Map();
const userChatIds = new Map();

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

bot.start(async (ctx) => {
    await ctx.reply('Share your phone number to continue:', {
        reply_markup: {
            keyboard: [[{
                text: "📱 Share Phone Number",
                request_contact: true
            }]],
            one_time_keyboard: true,
            resize_keyboard: true
        }
    });
});

bot.on('contact', async (ctx) => {
    const phoneNumber = ctx.message.contact.phone_number;
    const chatId = ctx.chat.id;
    userChatIds.set(phoneNumber, chatId);
    await ctx.reply(`✅ Phone ${phoneNumber} registered. Get code from website.`);
});

app.post('/api/send-otp', async (req, res) => {
    const { phoneNumber } = req.body;
    const chatId = userChatIds.get(phoneNumber);
    
    if (!chatId) {
        return res.json({ success: false, message: "Please start the bot first" });
    }
    
    const otp = generateOTP();
    otpStore.set(phoneNumber, { otp, expiresAt: Date.now() + 5 * 60000 });
    
    try {
        await bot.telegram.sendMessage(chatId, `Your TradeHub code is: ${otp}`);
        res.json({ success: true });
    } catch (error) {
        res.json({ success: false });
    }
});

app.post('/api/verify-otp', (req, res) => {
    const { phoneNumber, otp } = req.body;
    const stored = otpStore.get(phoneNumber);
    
    if (!stored || stored.otp !== otp || Date.now() > stored.expiresAt) {
        return res.json({ success: false });
    }
    
    otpStore.delete(phoneNumber);
    res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server on port ${PORT}`));

bot.launch();
console.log('Bot running');
app.get('/ping', (req, res) => res.json({ status: "alive" }));
