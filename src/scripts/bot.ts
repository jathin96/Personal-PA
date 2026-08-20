import 'dotenv/config';
import { getBot, startPolling } from '../lib/telegram';

console.log('🚀 Starting PA Assistant Telegram Bot Worker...');
console.log('Chat ID Whitelist:', process.env.ALLOWED_TELEGRAM_CHAT_ID);
console.log('Gemini Key present:', !!process.env.GEMINI_API_KEY);

startPolling();
