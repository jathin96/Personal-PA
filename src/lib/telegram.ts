import { Bot, InlineKeyboard, Context } from 'grammy';
import { processMessage, transcribeVoice } from './ai';
import * as taskService from './tasks';
import type { Task } from '@/types';

let bot: Bot | null = null;

export function getBot(): Bot {
  if (!bot) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) throw new Error('TELEGRAM_BOT_TOKEN not set');
    bot = new Bot(token);
    setupHandlers(bot);
  }
  return bot;
}

function isAllowed(ctx: Context): boolean {
  const allowedId = process.env.ALLOWED_TELEGRAM_CHAT_ID;
  if (!allowedId || allowedId === 'your_personal_telegram_chat_id') return true; // If not set, allow in dev mode
  return ctx.chat?.id.toString() === allowedId;
}

function setupHandlers(bot: Bot) {
  // Guard middleware
  bot.use(async (ctx, next) => {
    if (!isAllowed(ctx)) {
      console.log(`Rejected message from chat ID: ${ctx.chat?.id}`);
      return; // Silently drop unauthorized
    }
    await next();
  });

  // /start command
  bot.command('start', async (ctx) => {
    const chatId = ctx.chat?.id;
    console.log(`👤 Connected user Chat ID: ${chatId}`);
    
    await ctx.reply(
      `👋 *Hey! I'm your personal AI task assistant.*\n\n` +
      `Your Chat ID is: \`${chatId}\`\n\n` +
      `Just text me naturally:\n` +
      `• _"Remind me to buy groceries tomorrow"_\n` +
      `• _"What's on my plate today?"_\n` +
      `• _"I finished the client report"_\n` +
      `• _"Push the gym to Friday"_\n\n` +
      `You can also send voice notes! 🎙️`,
      { parse_mode: 'Markdown' }
    );
  });

  // Text messages -> AI
  bot.on('message:text', async (ctx) => {
    try {
      await ctx.replyWithChatAction('typing');
      const response = await processMessage(ctx.message.text);
      
      // Check if the response mentions listing tasks - add inline buttons
      const pendingTasks = await taskService.listTasks({ status: 'PENDING' });
      if (pendingTasks.length > 0 && (ctx.message.text.toLowerCase().includes('list') || 
          ctx.message.text.toLowerCase().includes('show') || 
          ctx.message.text.toLowerCase().includes('what') ||
          ctx.message.text.toLowerCase().includes('plate') ||
          ctx.message.text.toLowerCase().includes('today'))) {
        await ctx.reply(response, { parse_mode: 'Markdown' });
        // Send interactive buttons for top 5 pending tasks
        for (const task of pendingTasks.slice(0, 5)) {
          const keyboard = new InlineKeyboard()
            .text('✅ Done', `complete_${task.id}`)
            .text('⏰ +1 Day', `postpone_${task.id}`);
          const priorityEmoji = task.priority === 'HIGH' ? '🔴' : task.priority === 'MEDIUM' ? '🟡' : '🟢';
          await ctx.reply(`${priorityEmoji} #${task.id}: ${task.title}`, { reply_markup: keyboard });
        }
      } else {
        await ctx.reply(response, { parse_mode: 'Markdown' });
      }
    } catch (error: any) {
      console.error('AI processing error:', error);
      await ctx.reply('⚠️ Sorry, I ran into an issue processing that. Please try again.');
    }
  });

  // Voice messages -> Transcribe -> AI
  bot.on('message:voice', async (ctx) => {
    try {
      await ctx.replyWithChatAction('typing');
      const file = await ctx.getFile();
      const url = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;
      const response = await fetch(url);
      const buffer = Buffer.from(await response.arrayBuffer());
      
      const transcript = await transcribeVoice(buffer);
      await ctx.reply(`🎙️ _"${transcript}"_`, { parse_mode: 'Markdown' });
      
      const aiResponse = await processMessage(transcript);
      await ctx.reply(aiResponse, { parse_mode: 'Markdown' });
    } catch (error: any) {
      console.error('Voice processing error:', error);
      await ctx.reply('⚠️ Couldn\'t process that voice note. Please try again or type your message.');
    }
  });

  // Inline keyboard callbacks
  bot.on('callback_query:data', async (ctx) => {
    const data = ctx.callbackQuery.data;
    
    if (data.startsWith('complete_')) {
      const taskId = data.replace('complete_', '');
      const task = await taskService.completeTask(taskId);
      if (task) {
        await ctx.answerCallbackQuery({ text: `✅ "${task.title}" marked complete!` });
        await ctx.editMessageText(`✅ ~${task.title}~ — Done!`, { parse_mode: 'Markdown' });
      } else {
        await ctx.answerCallbackQuery({ text: '❌ Task not found' });
      }
    } else if (data.startsWith('postpone_')) {
      const taskId = data.replace('postpone_', '');
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const task = await taskService.rescheduleTask(taskId, tomorrow.toISOString());
      if (task) {
        await ctx.answerCallbackQuery({ text: `⏰ Postponed to tomorrow!` });
        const priorityEmoji = task.priority === 'HIGH' ? '🔴' : task.priority === 'MEDIUM' ? '🟡' : '🟢';
        await ctx.editMessageText(`${priorityEmoji} #${task.id}: ${task.title} — ⏰ Moved to tomorrow`);
      } else {
        await ctx.answerCallbackQuery({ text: '❌ Task not found' });
      }
    }
  });
}

export async function sendBriefing(): Promise<void> {
  const chatId = process.env.ALLOWED_TELEGRAM_CHAT_ID;
  if (!chatId) return;
  
  const b = getBot();
  const briefing = await taskService.getTodayBriefing();
  
  let message = '☀️ *Good Morning! Here\'s your daily briefing:*\n\n';
  
  if (briefing.overdue.length > 0) {
    message += '🚨 *Overdue:*\n';
    briefing.overdue.forEach(t => {
      message += `  • _${t.title}_ (was due ${new Date(t.dueDate!).toLocaleDateString()})\n`;
    });
    message += '\n';
  }
  
  if (briefing.today.length > 0) {
    message += '📋 *Due Today:*\n';
    briefing.today.forEach(t => {
      const priorityEmoji = t.priority === 'HIGH' ? '🔴' : t.priority === 'MEDIUM' ? '🟡' : '🟢';
      const time = t.dueDate ? new Date(t.dueDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '';
      message += `  ${priorityEmoji} ${t.title}${time ? ` at ${time}` : ''}\n`;
    });
    message += '\n';
  }
  
  if (briefing.pending.length > 0) {
    message += `📌 *${briefing.pending.length} task(s) with no due date*\n`;
  }
  
  if (briefing.today.length === 0 && briefing.overdue.length === 0 && briefing.pending.length === 0) {
    message += '🎉 *All clear!* No pending tasks. Enjoy your day!';
  }
  
  await b.api.sendMessage(parseInt(chatId), message, { parse_mode: 'Markdown' });
}

export function startPolling() {
  const b = getBot();
  b.start({
    onStart: () => console.log('🤖 Telegram bot started in polling mode'),
  });
}
