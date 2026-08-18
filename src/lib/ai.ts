import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import OpenAI from 'openai';
import * as taskService from './tasks';

// -------------------------------------------------------------
// System Prompt
// -------------------------------------------------------------
const SYSTEM_PROMPT = `You are a concise, highly organized personal assistant. You help manage tasks and schedule.

Rules:
- Be brief and actionable in responses.
- When creating tasks, infer reasonable defaults (priority: LOW, MEDIUM, or HIGH, due date) from context.
- When the user says they finished/completed something, mark it as done using complete_task.
- For date/time references like "tomorrow", "next Monday", "in 2 hours", calculate the actual ISO date/time. The user's timezone is {{USER_TIMEZONE}}. Current date/time: {{CURRENT_TIME}}
- When listing tasks, format them clearly.
- Execute tools directly whenever the user asks to add, list, complete, reschedule, delete, or search tasks.`;

// -------------------------------------------------------------
// Gemini Function Declarations
// -------------------------------------------------------------
const geminiTools: { functionDeclarations: FunctionDeclaration[] } = {
  functionDeclarations: [
    {
      name: 'create_task',
      description: 'Create a new task for the user',
      parameters: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: 'Title of the task' },
          due_date: { type: Type.STRING, description: 'ISO 8601 due date/time (optional)' },
          priority: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH'], description: 'Task priority' },
          description: { type: Type.STRING, description: 'Additional details about the task' },
        },
        required: ['title'],
      },
    },
    {
      name: 'list_tasks',
      description: 'List tasks, optionally filtered by status, date, or priority',
      parameters: {
        type: Type.OBJECT,
        properties: {
          status: { type: Type.STRING, enum: ['PENDING', 'COMPLETED', 'CANCELLED'] },
          filter_date: { type: Type.STRING, description: 'ISO date to filter by (shows tasks due on that date)' },
          priority: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH'] },
        },
      },
    },
    {
      name: 'complete_task',
      description: 'Mark a task as completed. Can use task ID number or a keyword from the title.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          task_id_or_title_keyword: { type: Type.STRING, description: 'Task ID (number) or keyword from the task title' },
        },
        required: ['task_id_or_title_keyword'],
      },
    },
    {
      name: 'reschedule_task',
      description: 'Reschedule a task to a new date/time',
      parameters: {
        type: Type.OBJECT,
        properties: {
          task_id_or_title_keyword: { type: Type.STRING, description: 'Task ID or keyword from the task title' },
          new_due_date: { type: Type.STRING, description: 'New ISO 8601 due date/time' },
        },
        required: ['task_id_or_title_keyword', 'new_due_date'],
      },
    },
    {
      name: 'delete_task',
      description: 'Delete/remove a task permanently',
      parameters: {
        type: Type.OBJECT,
        properties: {
          task_id_or_title_keyword: { type: Type.STRING, description: 'Task ID or keyword from the task title' },
        },
        required: ['task_id_or_title_keyword'],
      },
    },
    {
      name: 'search_tasks',
      description: 'Search tasks by keyword in title or description',
      parameters: {
        type: Type.OBJECT,
        properties: {
          query: { type: Type.STRING, description: 'Search keyword' },
        },
        required: ['query'],
      },
    },
  ],
};

// -------------------------------------------------------------
// OpenAI Function Definitions (Fallback)
// -------------------------------------------------------------
const openaiTools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'create_task',
      description: 'Create a new task for the user',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Title of the task' },
          due_date: { type: 'string', description: 'ISO 8601 due date/time (optional)' },
          priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'], description: 'Task priority' },
          description: { type: 'string', description: 'Additional details about the task' },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_tasks',
      description: 'List tasks, optionally filtered by status, date, or priority',
      parameters: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['PENDING', 'COMPLETED', 'CANCELLED'] },
          filter_date: { type: 'string', description: 'ISO date to filter by' },
          priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'complete_task',
      description: 'Mark a task as completed.',
      parameters: {
        type: 'object',
        properties: {
          task_id_or_title_keyword: { type: 'string', description: 'Task ID or title keyword' },
        },
        required: ['task_id_or_title_keyword'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'reschedule_task',
      description: 'Reschedule a task to a new date/time',
      parameters: {
        type: 'object',
        properties: {
          task_id_or_title_keyword: { type: 'string', description: 'Task ID or keyword' },
          new_due_date: { type: 'string', description: 'New ISO 8601 due date/time' },
        },
        required: ['task_id_or_title_keyword', 'new_due_date'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_task',
      description: 'Delete a task permanently',
      parameters: {
        type: 'object',
        properties: {
          task_id_or_title_keyword: { type: 'string', description: 'Task ID or keyword' },
        },
        required: ['task_id_or_title_keyword'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_tasks',
      description: 'Search tasks by keyword',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search keyword' },
        },
        required: ['query'],
      },
    },
  },
];

// -------------------------------------------------------------
// Tool Execution Engine
// -------------------------------------------------------------
async function executeTool(name: string, args: any): Promise<any> {
  try {
    switch (name) {
      case 'create_task': {
        const task = await taskService.createTask({
          title: args.title,
          description: args.description,
          priority: args.priority,
          dueDate: args.due_date,
        });
        return { success: true, task };
      }
      case 'list_tasks': {
        const tasks = await taskService.listTasks({
          status: args.status,
          priority: args.priority,
          filterDate: args.filter_date,
        });
        return { success: true, tasks, count: tasks.length };
      }
      case 'complete_task': {
        const task = await taskService.completeTask(args.task_id_or_title_keyword);
        if (!task) return { success: false, error: 'Task not found' };
        return { success: true, task };
      }
      case 'reschedule_task': {
        const task = await taskService.rescheduleTask(args.task_id_or_title_keyword, args.new_due_date);
        if (!task) return { success: false, error: 'Task not found' };
        return { success: true, task };
      }
      case 'delete_task': {
        const task = await taskService.deleteTask(args.task_id_or_title_keyword);
        if (!task) return { success: false, error: 'Task not found' };
        return { success: true, deletedTask: task };
      }
      case 'search_tasks': {
        const tasks = await taskService.searchTasks(args.query);
        return { success: true, tasks, count: tasks.length };
      }
      default:
        return { success: false, error: `Unknown tool: ${name}` };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// -------------------------------------------------------------
// Process Natural Language Message (Gemini / OpenAI)
// -------------------------------------------------------------
export async function processMessage(text: string): Promise<string> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  const timezone = process.env.USER_TIMEZONE || 'Asia/Kolkata';
  const systemPrompt = SYSTEM_PROMPT
    .replace('{{USER_TIMEZONE}}', timezone)
    .replace('{{CURRENT_TIME}}', new Date().toISOString());

  // 1. Prefer Google Gemini if configured
  if (geminiKey && geminiKey !== 'your_gemini_key' && geminiKey.trim() !== '') {
    const ai = new GoogleGenAI({ apiKey: geminiKey });

    const contents: any[] = [
      { role: 'user', parts: [{ text: `${systemPrompt}\n\nUser request: ${text}` }] },
    ];

    let response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents,
      config: {
        tools: [geminiTools],
      },
    });

    let functionCalls = response.functionCalls;

    // Loop through function calls
    let loopCount = 0;
    while (functionCalls && functionCalls.length > 0 && loopCount < 5) {
      loopCount++;
      const functionResponses: any[] = [];

      for (const call of functionCalls) {
        const toolName = call.name || '';
        const result = await executeTool(toolName, call.args);
        functionResponses.push({
          functionResponse: {
            name: toolName,
            response: result,
          },
        });
      }

      contents.push(response.candidates?.[0]?.content || { role: 'model', parts: [] });
      contents.push({ role: 'user', parts: functionResponses });

      response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents,
        config: {
          tools: [geminiTools],
        },
      });

      functionCalls = response.functionCalls;
    }

    return response.text || 'Action completed.';
  }

  // 2. OpenAI Fallback
  if (openaiKey && openaiKey !== 'your_ai_key' && openaiKey.trim() !== '') {
    const openai = new OpenAI({ apiKey: openaiKey });
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: text },
    ];

    let response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      tools: openaiTools,
      tool_choice: 'auto',
    });

    let assistantMessage = response.choices[0].message;

    while (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      messages.push(assistantMessage);

      for (const toolCall of assistantMessage.tool_calls) {
        if ('function' in toolCall && toolCall.function) {
          const args = JSON.parse(toolCall.function.arguments);
          const result = await executeTool(toolCall.function.name, args);
          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(result),
          });
        }
      }

      response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        tools: openaiTools,
        tool_choice: 'auto',
      });

      assistantMessage = response.choices[0].message;
    }

    return assistantMessage.content || 'Action completed.';
  }

  return '⚠️ *Gemini API Key not configured!*\n\nPlease add your `GEMINI_API_KEY` in the `.env` file to enable natural language task management and voice processing.';
}

// -------------------------------------------------------------
// Voice Note Transcription (Gemini Multimodal / OpenAI Whisper)
// -------------------------------------------------------------
export async function transcribeVoice(audioBuffer: Buffer): Promise<string> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (geminiKey && geminiKey !== 'your_gemini_key') {
    const ai = new GoogleGenAI({ apiKey: geminiKey });
    const base64Audio = audioBuffer.toString('base64');

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: 'audio/ogg',
                data: base64Audio,
              },
            },
            {
              text: 'Please transcribe this voice message precisely into text. Do not add explanations, just provide the exact transcription.',
            },
          ],
        },
      ],
    });

    return response.text?.trim() || '';
  }

  if (openaiKey && openaiKey !== 'your_ai_key') {
    const openai = new OpenAI({ apiKey: openaiKey });
    const file = new File([new Uint8Array(audioBuffer)], 'voice.ogg', { type: 'audio/ogg' });
    const transcription = await openai.audio.transcriptions.create({
      model: 'whisper-1',
      file,
    });
    return transcription.text;
  }

  throw new Error('No AI API key configured for voice transcription.');
}
