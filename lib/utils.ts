import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, differenceInDays } from 'date-fns';
import type { DocumentStatus } from './types';

// Merge Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format date utilities
export function formatDate(date: string | Date, formatStr: string = 'PPP'): string {
  return format(new Date(date), formatStr);
}

export function formatRelativeTime(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

// Calculate duration from timestamps
export function calculateDuration(startTime: string, endTime: string): number {
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  return Math.round((end - start) / 1000 / 60); // minutes
}

// Format duration in minutes to readable string
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

// Generate Google Maps link from coordinates
export function generateGoogleMapsLink(lat: number, lng: number): string {
  return `https://maps.google.com/?q=${lat},${lng}`;
}

// Generate WhatsApp share link
export function generateWhatsAppLink(phone: string, message: string): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}

// Determine document status based on expiration date
export function getDocumentStatus(expirationDate: string | null | undefined): DocumentStatus {
  if (!expirationDate) {
    return { status: 'valid', color: 'green' };
  }

  const daysUntilExpiration = differenceInDays(new Date(expirationDate), new Date());

  if (daysUntilExpiration < 0) {
    return { status: 'expired', color: 'red', daysUntilExpiration };
  } else if (daysUntilExpiration <= 30) {
    return { status: 'expiring_soon', color: 'yellow', daysUntilExpiration };
  } else {
    return { status: 'valid', color: 'green', daysUntilExpiration };
  }
}

// Format currency
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

// Get initials from name
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
