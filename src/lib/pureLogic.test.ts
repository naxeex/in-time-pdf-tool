import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parsePageRange,
  formatFileSize,
  validatePdfHeader,
  generateSecurePassword,
  calculateSavedPercentage,
} from './pureLogic.ts';

test('parsePageRange handles empty or "all" keywords', () => {
  assert.deepEqual(parsePageRange('all', 5), [0, 1, 2, 3, 4]);
  assert.deepEqual(parsePageRange('*', 3), [0, 1, 2]);
  assert.deepEqual(parsePageRange('', 4), [0, 1, 2, 3]);
  assert.deepEqual(parsePageRange('all', 0), []);
});

test('parsePageRange handles odd and even keywords', () => {
  assert.deepEqual(parsePageRange('odd', 5), [0, 2, 4]);
  assert.deepEqual(parsePageRange('even', 5), [1, 3]);
  assert.deepEqual(parsePageRange('last', 6), [5]);
});

test('parsePageRange parses ranges and comma lists correctly', () => {
  assert.deepEqual(parsePageRange('1-3, 5', 6), [0, 1, 2, 4]);
  assert.deepEqual(parsePageRange('2, 4, 6', 7), [1, 3, 5]);
  assert.deepEqual(parsePageRange('4-2', 5), [1, 2, 3]); // handles inverted range
  assert.deepEqual(parsePageRange('10-20', 5), []); // out of bounds clamped
});

test('formatFileSize produces clean tabular output', () => {
  assert.equal(formatFileSize(0), '0 B');
  assert.equal(formatFileSize(500), '500 B');
  assert.equal(formatFileSize(1024), '1.00 KB');
  assert.equal(formatFileSize(1536), '1.50 KB');
  assert.equal(formatFileSize(1048576), '1.00 MB');
  assert.equal(formatFileSize(1073741824), '1.00 GB');
});

test('validatePdfHeader checks %PDF- magic bytes', () => {
  const valid = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);
  assert.equal(validatePdfHeader(valid), true);

  const invalid = new Uint8Array([0x89, 0x50, 0x4e, 0x47]); // PNG header
  assert.equal(validatePdfHeader(invalid), false);

  assert.equal(validatePdfHeader(new Uint8Array([])), false);
});

test('generateSecurePassword respects length and entropy', () => {
  const pwd1 = generateSecurePassword(12);
  assert.equal(pwd1.length, 12);

  const pwd2 = generateSecurePassword(24, {
    includeUppercase: false,
    includeSymbols: false,
    includeNumbers: true,
  });
  assert.equal(pwd2.length, 24);
  assert.equal(/[A-Z]/.test(pwd2), false);

  const pwdDefault = generateSecurePassword();
  assert.equal(pwdDefault.length, 16);
});

test('calculateSavedPercentage calculates accurate ratios', () => {
  assert.equal(calculateSavedPercentage(1000, 500), 50);
  assert.equal(calculateSavedPercentage(1000, 800), 20);
  assert.equal(calculateSavedPercentage(1000, 1200), 0);
  assert.equal(calculateSavedPercentage(0, 500), 0);
});
