import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAddress(address: string, length = 8): string {
  if (!address) return '';
  if (address.length <= length * 2) return address;
  return `${address.slice(0, length)}...${address.slice(-length)}`;
}

export function formatAPT(octas: number | string): string {
  const numOctas = typeof octas === 'string' ? parseInt(octas) : octas;
  const apt = numOctas / 100000000;
  
  if (apt < 0.001) {
    return '<0.001 APT';
  } else if (apt < 1) {
    return `${apt.toFixed(6)} APT`;
  } else {
    return `${apt.toFixed(4)} APT`;
  }
}

export function formatGas(gas: number): string {
  return new Intl.NumberFormat('ja-JP').format(gas);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('ja-JP').format(num);
}

export function validateAddress(address: string): boolean {
  if (!address) return false;
  
  // Aptos addresses are 32 bytes (64 hex characters) or shorter with 0x prefix
  const cleanAddress = address.startsWith('0x') ? address.slice(2) : address;
  const hexPattern = /^[0-9a-fA-F]+$/;
  
  return hexPattern.test(cleanAddress) && cleanAddress.length <= 64;
}

export function validateMoveFunction(func: string): boolean {
  if (!func) return false;
  
  // Move function format: address::module::function
  const parts = func.split('::');
  return parts.length === 3 && parts.every(part => part.length > 0);
}

export function parseTransactionArguments(args: string[]): any[] {
  return args.map(arg => {
    // Try to parse as different types
    if (arg === 'true' || arg === 'false') {
      return arg === 'true';
    }
    
    if (/^\d+$/.test(arg)) {
      return parseInt(arg);
    }
    
    if (/^\d+\.\d+$/.test(arg)) {
      return parseFloat(arg);
    }
    
    // Handle vectors/arrays
    if (arg.startsWith('[') && arg.endsWith(']')) {
      try {
        return JSON.parse(arg);
      } catch {
        return arg;
      }
    }
    
    // Return as string
    return arg;
  });
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text);
  }
  
  // Fallback for older browsers
  const textArea = document.createElement('textarea');
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  
  try {
    document.execCommand('copy');
    return Promise.resolve();
  } catch (error) {
    return Promise.reject(error);
  } finally {
    document.body.removeChild(textArea);
  }
}

export function getRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (seconds < 60) return `${seconds}秒前`;
  if (minutes < 60) return `${minutes}分前`;
  if (hours < 24) return `${hours}時間前`;
  return `${days}日前`;
}