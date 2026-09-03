import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

export type NotificationJobName =
  | 'leave-submitted'
  | 'leave-decided'
  | 'payroll-completed'
  | 'generic';

export interface NotificationJobData {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

@Injectable()
export class NotificationService {
  constructor(@InjectQueue('notifications') private readonly queue: Queue<NotificationJobData>) {}

  async enqueue(name: NotificationJobName, data: NotificationJobData) {
    await this.queue.add(name, data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 100,
    });
  }
}
