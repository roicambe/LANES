import { apiClient } from '@/lib/apiClient';

export interface Notification {
  id: number;
  user_id: number;
  type: string;
  message: string;
  payload: Record<string, any> | null;
  is_read: boolean;
  created_at: string;
}

export interface NotificationPaginatedResponse {
  notifications: Notification[];
  total: number;
  unread_count: number;
  has_more: boolean;
}

export const getNotifications = async (skip: number = 0, limit: number = 50): Promise<NotificationPaginatedResponse> => {
  const response = await apiClient.get(`/api/v1/notifications/?skip=${skip}&limit=${limit}`);
  return response.data;
};

export const markAsRead = async (notificationId: number): Promise<Notification> => {
  const response = await apiClient.post(`/api/v1/notifications/${notificationId}/read`);
  return response.data;
};

export const markAllAsRead = async (): Promise<{ message: string }> => {
  const response = await apiClient.post(`/api/v1/notifications/read-all`);
  return response.data;
};
