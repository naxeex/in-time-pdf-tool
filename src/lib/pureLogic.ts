/**
 * Pure parsing, mathematical utilities, and password generation.
 * Separated for deterministic unit testing in node:test.
 */

export interface PageRangeOptions {
  totalPages: number;
}

/**
 * Parses user page input like "1-3, 5, 8-10", "all", "odd", "even"
 * Returns 0-indexed page indices in sorted unique order.
 */
export function parsePageRange(rangeStr: string, totalPages: number): number[] {
  if (totalPages <= 0) return [];
  const normalized = rangeStr.trim().toLowerCase();

  if (!normalized || normalized === 'all' || normalized === '*') {
    return Array.from({ length: totalPages }, (_, i) => i);
  }

  if (normalized === 'odd') {
    return Array.from({ length: totalPages }, (_, i) => i).filter((i) => (i + 1) % 2 !== 0);
  }

  if (normalized === 'even') {
    return Array.from({ length: totalPages }, (_, i) => i).filter((i) => (i + 1) % 2 === 0);
  }

  if (normalized === 'last') {
    return [totalPages - 1];
  }

  const selectedIndices = new Set<number>();
  const parts = normalized.split(/[,;\s]+/).filter(Boolean);

  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);

      if (!isNaN(start) && !isNaN(end)) {
        const min = Math.max(1, Math.min(start, end));
        const max = Math.min(totalPages, Math.max(start, end));
        for (let p = min; p <= max; p++) {
          selectedIndices.add(p - 1);
        }
      }
    } else {
      const page = parseInt(part, 10);
      if (!isNaN(page) && page >= 1 && page <= totalPages) {
        selectedIndices.add(page - 1);
      }
    }
  }

  return Array.from(selectedIndices).sort((a, b) => a - b);
}

/**
 * Formats byte values into human-readable strings with tabular stability.
 */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const clampedIndex = Math.min(i, units.length - 1);

  if (clampedIndex === 0) {
    return `${bytes} B`;
  }

  const value = bytes / Math.pow(k, clampedIndex);
  return `${value.toFixed(2)} ${units[clampedIndex]}`;
}

/**
 * Checks if a byte buffer starts with standard PDF magic header (%PDF-)
 */
export function validatePdfHeader(buffer: Uint8Array): boolean {
  if (!buffer || buffer.length < 5) return false;
  // %PDF- is [0x25, 0x50, 0x44, 0x46, 0x2d]
  return (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46 &&
    buffer[4] === 0x2d
  );
}

export interface PasswordGeneratorOptions {
  includeUppercase?: boolean;
  includeLowercase?: boolean;
  includeNumbers?: boolean;
  includeSymbols?: boolean;
}

/**
 * Generates a high-entropy password of specified length.
 */
export function generateSecurePassword(
  length: number = 16,
  options: PasswordGeneratorOptions = {}
): string {
  const {
    includeUppercase = true,
    includeLowercase = true,
    includeNumbers = true,
    includeSymbols = true,
  } = options;

  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // excluded ambiguous I, O
  const lower = 'abcdefghijkmnopqrstuvwxyz'; // excluded ambiguous l
  const numbers = '23456789'; // excluded ambiguous 0, 1
  const symbols = '!@#$%^&*()-_=+[]{}<>?~';

  let pool = '';
  if (includeUppercase) pool += upper;
  if (includeLowercase) pool += lower;
  if (includeNumbers) pool += numbers;
  if (includeSymbols) pool += symbols;

  if (!pool) pool = lower + numbers;

  const effectiveLength = Math.max(6, Math.min(64, length));
  let result = '';

  for (let i = 0; i < effectiveLength; i++) {
    const randomIndex = Math.floor(Math.random() * pool.length);
    result += pool[randomIndex];
  }

  return result;
}

/**
 * Calculates compression percentage saved.
 */
export function calculateSavedPercentage(originalSize: number, newSize: number): number {
  if (originalSize <= 0) return 0;
  if (newSize >= originalSize) return 0;
  const saved = ((originalSize - newSize) / originalSize) * 100;
  return Math.round(saved * 10) / 10;
}
