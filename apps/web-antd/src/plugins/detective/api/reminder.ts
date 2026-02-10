import { requestClient } from '#/api/request';

const REMINDER_PREFIX = '/api/v1/detective/reminders';

export interface Reminder {
  id: number;
  title: string;
  message: string;
  remind_at: string;
  is_read: boolean;
  related_type?: string; // e.g., 'bill', 'budget'
  related_id?: number;
  created_at: string;
}

export interface CreateReminderParams {
  title: string;
  message: string;
  remind_at: string;
  related_type?: string;
  related_id?: number;
}

/** 获取提醒列表 */
export function getRemindersApi() {
  return requestClient.get<Reminder[]>(REMINDER_PREFIX);
}

/** 获取未读数量 */
export function getUnreadReminderCountApi() {
  return requestClient.get<{ count: number }>(
    `${REMINDER_PREFIX}/unread-count`,
  );
}

/** 标记已读 */
export function markReminderReadApi(id: number) {
  return requestClient.post(`${REMINDER_PREFIX}/${id}/mark-read`);
}

/** 全部已读 */
export function markAllRemindersReadApi() {
  return requestClient.post(`${REMINDER_PREFIX}/mark-all-read`);
}

/** 创建提醒 */
export function createReminderApi(data: CreateReminderParams) {
  return requestClient.post<Reminder>(REMINDER_PREFIX, data);
}

/** 删除提醒 */
export function deleteReminderApi(id: number) {
  return requestClient.delete(`${REMINDER_PREFIX}/${id}`);
}
