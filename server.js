const express = require('express');
const cors = require('cors');
const { Telegraf } = require('telegraf');

const app = express();
app.use(cors());
app.use(express.json());

const BOT_TOKEN = '8628012079:AAH_OXAydeiMctcCdckNa8tvGzKklPdiwRs';
// ==============================================================

const bot = new Telegraf(BOT_TOKEN);

// Store OTPs temporarily
const otpStore = new Map();
const userChatIds = new Map();

// Generate 6-digit code
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// ========== BOT COMMANDS ==========

// When user starts the bot
bot.start(async (ctx) => {
    await ctx.reply('🔐 Welcome to TradeHub Verification Bot!\n\nPlease share your phone number to continue.', {
        reply_markup: {
            keyboard: [[{
                text: "📱 Share My Phone Number",
                request_contact: true
            }]],
            one_time_keyboard: true,
            resize_keyboard: true
        }
    });
});

// When user shares phone number
bot.on('contact', async (ctx) => {
    const contact = ctx.message.contact;
    const phoneNumber = contact.phone_number;
    const chatId = ctx.chat.id;
    
    userChatIds.set(phoneNumber, chatId);
    
    await ctx.reply(`✅ Phone number ${phoneNumber} registered!\n\nYou can now verify on the TradeHub website.`);
});

// ========== API ENDPOINTS FOR YOUR WEBSITE ==========

// Send OTP
app.post('/api/send-otp', async (req, res) => {
    const { phoneNumber } = req.body;
    
    const chatId = userChatIds.get(phoneNumber);
    if (!chatId) {
        return res.json({ 
            success: false, 
            message: "Please start the Telegram bot first: https://t.me/YOUR_BOT_USERNAME" 
        });
    }
    
    const otp = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000;
    otpStore.set(phoneNumber, { otp, expiresAt });
    
    try {
        await bot.telegram.sendMessage(chatId, 
            `🔐 Your TradeHub verification code is:\n\n<code>${otp}</code>\n\nThis code expires in 5 minutes.\n\nEnter this code on the TradeHub website to complete registration.`,
            { parse_mode: 'HTML' }
        );
        
        res.json({ success: true, message: "OTP sent to your Telegram" });
    } catch (error) {
        res.json({ success: false, message: "Failed to send. Please try again." });
    }
});

// Verify OTP
app.post('/api/verify-otp', (req, res) => {
    const { phoneNumber, otp } = req.body;
    
    const stored = otpStore.get(phoneNumber);
    
    if (!stored) {
        return res.json({ success: false, message: "No OTP found. Request a new one." });
    }
    
    if (Date.now() > stored.expiresAt) {
        otpStore.delete(phoneNumber);
        return res.json({ success: false, message: "OTP expired. Request a new one." });
    }
    
    if (stored.otp !== otp) {
        return res.json({ success: false, message: "Invalid OTP. Try again." });
    }
    
    otpStore.delete(phoneNumber);
    res.json({ success: true, message: "Phone verified successfully!" });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

bot.launch();
console.log('Bot is running...');