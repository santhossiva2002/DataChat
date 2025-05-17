import { twMerge } from "tailwind-merge";

// Combine multiple class names with Tailwind support
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Simple implementation of clsx function
function clsx(inputs) {
  const classes = [];
  
  if (!Array.isArray(inputs)) {
    return '';
  }
  
  for (const input of inputs) {
    if (!input) continue;
    
    const inputType = typeof input;
    
    if (inputType === 'string' || inputType === 'number') {
      classes.push(input.toString());
    } else if (Array.isArray(input)) {
      const nestedClasses = clsx(input);
      if (nestedClasses) {
        classes.push(nestedClasses);
      }
    } else if (inputType === 'object') {
      for (const key in input) {
        if (input[key]) {
          classes.push(key);
        }
      }
    }
  }
  
  return classes.join(' ');
}

// Format date to human-readable string
export function formatDate(date) {
  if (!date) return '';
  
  const d = new Date(date);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}

// Format date to short format (MM/DD/YYYY)
export function formatShortDate(date) {
  if (!date) return '';
  
  const d = new Date(date);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).format(d);
}

// Truncate text with ellipsis after a certain length
export function truncateText(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

// Generate a simple, unique ID
export function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

// Convert file size bytes to human-readable format
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Delay promise (useful for loading states in development)
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Check if object is empty
export function isEmptyObject(obj) {
  return Object.keys(obj).length === 0;
}
