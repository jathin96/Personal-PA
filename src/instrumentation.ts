export async function register() {
  // Only run on the server side (not edge)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Start Telegram bot if token is configured
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    if (telegramToken && telegramToken !== 'your_bot_token_from_botfather') {
      try {
        const { startPolling } = await import('@/lib/telegram');
        const botMode = process.env.BOT_MODE || 'polling';
        if (botMode === 'polling') {
          startPolling();
        }
      } catch (error) {
        console.warn('⚠️ Telegram bot failed to start:', error);
      }

      // Morning briefing cron
      try {
        const cron = await import('node-cron');
        const { sendBriefing } = await import('@/lib/telegram');
        const timezone = process.env.USER_TIMEZONE || 'Asia/Kolkata';
        cron.default.schedule('0 8 * * *', async () => {
          console.log('⏰ Running morning briefing...');
          try {
            await sendBriefing();
            console.log('✅ Morning briefing sent!');
          } catch (error) {
            console.error('❌ Morning briefing failed:', error);
          }
        }, { timezone });
        console.log(`📅 Morning briefing scheduled for 8:00 AM (${timezone})`);
      } catch (error) {
        console.warn('⚠️ Cron scheduling failed:', error);
      }
    } else {
      console.log('ℹ️ Telegram bot not configured. Set TELEGRAM_BOT_TOKEN in .env to enable.');
    }
  }
}
