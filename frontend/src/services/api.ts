import axios from 'axios';
import type { ContentFormat, ContentResponse, UploadResponse, ChatMessage, ChatResponse, GenerationHistoryEntry } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 120000, // 2 min for video processing
});

// Attach auth token if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sb-access-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function uploadVideo(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post<UploadResponse>('/api/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 300000, // 5 min for large uploads
  });
  return response.data;
}

export async function generateContent(
  videoUrl: string,
  formats: ContentFormat[],
  voiceExamples: string[] = [],
  customInstructions: string = ''
): Promise<ContentResponse> {
  const response = await api.post<ContentResponse>('/api/generate', {
    video_url: videoUrl,
    formats,
    voice_examples: voiceExamples,
    custom_instructions: customInstructions,
  });
  return response.data;
}

export async function sendChatMessage(
  messages: ChatMessage[],
  context: string = ''
): Promise<ChatResponse> {
  const response = await api.post<ChatResponse>('/api/chat', {
    messages,
    context,
  });
  return response.data;
}

export async function getGenerationStatus(): Promise<{
  remaining: number;
  max_allowed: number;
  is_authenticated: boolean;
}> {
  const response = await api.get('/api/generation-status');
  return response.data;
}

export async function getCurrentUser(): Promise<{
  user: any;
  is_guest: boolean;
  remaining_generations: number;
}> {
  const response = await api.get('/api/auth/user');
  return response.data;
}

export async function deleteVideo(fileId: string): Promise<void> {
  await api.delete(`/api/upload/${fileId}`);
}

export async function submitContactForm(data: { name: string; email?: string; subject: string; message: string }) {
  const response = await api.post('/api/contact', data);
  return response.data;
}

export async function getNotifications(): Promise<any[]> {
  const response = await api.get('/api/notifications');
  return response.data;
}

export async function markNotificationRead(id: string): Promise<void> {
  await api.put(`/api/notifications/${id}/read`);
}

export async function clearAllNotifications(): Promise<void> {
  await api.delete('/api/notifications');
}

// ── Generation History ───────────────────────────────────────────────────────

export async function getHistory(): Promise<GenerationHistoryEntry[]> {
  const response = await api.get<GenerationHistoryEntry[]>('/api/history');
  return response.data;
}

export async function saveHistoryEntry(data: {
  video_name: string;
  formats: string[];
  content: any[];
}): Promise<GenerationHistoryEntry> {
  const response = await api.post<GenerationHistoryEntry>('/api/history', data);
  return response.data;
}

export async function deleteHistoryEntry(id: string): Promise<void> {
  await api.delete(`/api/history/${id}`);
}

export async function renameHistoryEntry(id: string, name: string): Promise<GenerationHistoryEntry> {
  const response = await api.patch<GenerationHistoryEntry>(`/api/history/${id}/rename`, { video_name: name });
  return response.data;
}

export async function clearHistory(): Promise<void> {
  await api.delete('/api/history');
}

export async function resetPassword(email: string): Promise<void> {
  await api.post('/api/auth/reset-password', null, { params: { email } });
}

export async function updateUserPassword(password: string): Promise<void> {
  await api.post('/api/auth/update-password', null, { params: { password } });
}

export default api;
