import { EventEmitter } from 'events';

class TaskEventEmitter extends EventEmitter {
  private static instance: TaskEventEmitter;
  
  private constructor() {
    super();
    this.setMaxListeners(100);
  }
  
  static getInstance(): TaskEventEmitter {
    if (!TaskEventEmitter.instance) {
      TaskEventEmitter.instance = new TaskEventEmitter();
    }
    return TaskEventEmitter.instance;
  }
  
  emitTaskEvent(type: 'task_created' | 'task_updated' | 'task_deleted', data: any) {
    this.emit('task_event', { type, data, timestamp: Date.now() });
  }
}

export const taskEvents = TaskEventEmitter.getInstance();
