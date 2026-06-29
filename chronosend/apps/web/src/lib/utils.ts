import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));
}

export function formatRelativeTime(date: string | Date): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = then - now;

  const isPast = diff < 0;
  const absDiff = Math.abs(diff);

  const minutes = Math.floor(absDiff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${isPast ? '' : 'in '}${days}d${isPast ? ' ago' : ''}`;
  if (hours > 0) return `${isPast ? '' : 'in '}${hours}h${isPast ? ' ago' : ''}`;
  if (minutes > 0) return `${isPast ? '' : 'in '}${minutes}m${isPast ? ' ago' : ''}`;
  return 'just now';
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'pending':
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800';
    case 'sending':
      return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
    case 'sent':
      return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800';
    case 'failed':
      return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800';
    case 'cancelled':
      return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800';
    default:
      return 'bg-gray-500/10 text-gray-600 dark:text-gray-400';
  }
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}
