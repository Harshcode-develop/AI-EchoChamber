export type ContentFormat = 'linkedin' | 'x_thread' | 'instagram' | 'youtube' | 'blog';

export interface GeneratedContentItem {
  format: ContentFormat;
  content: string;
  title: string;
  character_count: number;
  word_count: number;
}

export interface ContentResponse {
  id: string;
  generated_content: GeneratedContentItem[];
  video_url: string;
  remaining_generations: number;
  created_at: string;
}

export interface GenerationHistoryEntry {
  id: string;
  video_name: string;
  formats: string[];
  content: GeneratedContentItem[];
  created_at: string;
}

export interface UploadResponse {
  file_url: string;
  file_id: string;
  file_name: string;
  file_size: number;
  message: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  message: { role: string; content: string };
  suggested_questions: string[];
}

export interface User {
  id: string;
  email: string;
  role?: string;
  remaining_generations: number;
}

export interface AuthState {
  user: User | null;
  isGuest: boolean;
  remainingGenerations: number;
  isLoading: boolean;
}

export interface FormatOption {
  id: ContentFormat;
  name: string;
  description: string;
  icon: string;
  color: string;
  bgColor: string;
}

export const FORMAT_OPTIONS: FormatOption[] = [
  {
    id: 'linkedin',
    name: 'LinkedIn Post',
    description: 'Professional, engaging post for your network',
    icon: 'linkedin',
    color: '#3B82F6',
    bgColor: 'rgba(59, 130, 246, 0.1)',
  },
  {
    id: 'x_thread',
    name: 'X Thread',
    description: 'Viral-worthy thread with hooks',
    icon: 'twitter',
    color: '#0F172A',
    bgColor: 'rgba(15, 23, 42, 0.1)',
  },
  {
    id: 'instagram',
    name: 'Instagram Caption',
    description: 'Engaging caption with hashtags',
    icon: 'instagram',
    color: 'linear-gradient(135deg, #F97316 0%, #EC4899 100%)',
    bgColor: 'rgba(236, 72, 153, 0.1)',
  },
  {
    id: 'youtube',
    name: 'YouTube Description',
    description: 'SEO-optimized video description',
    icon: 'youtube',
    color: '#EF4444',
    bgColor: 'rgba(239, 68, 68, 0.1)',
  },
  {
    id: 'blog',
    name: 'Blog Article',
    description: 'Long-form SEO content',
    icon: 'file-text',
    color: '#F97316',
    bgColor: 'rgba(249, 115, 22, 0.1)',
  },
];
