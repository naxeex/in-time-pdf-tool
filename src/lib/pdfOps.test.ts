import test from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';
import {
  createBlankPdf,
  mergePdfs,
  splitPdf,
  rotatePages,
  reversePages,
  extractPages,
  removePages,
  addWatermark,
  addPageNumbers,
  createPdfFromText,
  compressPdf,
  editMetadata,
  removeMetadata,
  getPdfInfo,
} from './pdfOps.ts';

test('createBlankPdf creates valid PDF with specified page count', async () => {
  const bytes = await createBlankPdf(3, 'A4');
  assert.ok(bytes.length > 0);
  const doc = await PDFDocument.load(bytes);
  assert.equal(doc.getPageCount(), 3);
});

test('mergePdfs joins multiple documents into one', async () => {
  const doc1 = await createBlankPdf(2);
  const doc2 = await createBlankPdf(3);
  const merged = await mergePdfs([doc1, doc2]);
  const loaded = await PDFDocument.load(merged);
  assert.equal(loaded.getPageCount(), 5);
});

test('splitPdf divides a PDF by pages or ranges', async () => {
  const source = await createBlankPdf(4);
  const splitResults = await splitPdf(source, 'all');
  assert.equal(splitResults.length, 4);

  const rangeResults = await splitPdf(source, 'ranges', '1-2');
  assert.equal(rangeResults.length, 1);
  const rangeDoc = await PDFDocument.load(rangeResults[0].data);
  assert.equal(rangeDoc.getPageCount(), 2);
});

test('rotatePages rotates specified page angle', async () => {
  const source = await createBlankPdf(2);
  const rotated = await rotatePages(source, { 0: 90 });
  const doc = await PDFDocument.load(rotated);
  assert.equal(doc.getPage(0).getRotation().angle, 90);
  assert.equal(doc.getPage(1).getRotation().angle, 0);
});

test('reversePages inverts page order', async () => {
  const source = await createBlankPdf(3);
  const reversed = await reversePages(source);
  const doc = await PDFDocument.load(reversed);
  assert.equal(doc.getPageCount(), 3);
});

test('extractPages creates document with selected pages', async () => {
  const source = await createBlankPdf(5);
  const extracted = await extractPages(source, [0, 2, 4]);
  const doc = await PDFDocument.load(extracted);
  assert.equal(doc.getPageCount(), 3);
});

test('removePages removes chosen pages', async () => {
  const source = await createBlankPdf(5);
  const reduced = await removePages(source, [1, 3]);
  const doc = await PDFDocument.load(reduced);
  assert.equal(doc.getPageCount(), 3);
});

test('addWatermark adds text watermark without corrupting', async () => {
  const source = await createBlankPdf(2);
  const watermarked = await addWatermark(source, {
    text: 'CONFIDENTIAL',
    opacity: 0.3,
    fontSize: 36,
    angle: 45,
    colorHex: '#dc2626',
  });
  const doc = await PDFDocument.load(watermarked);
  assert.equal(doc.getPageCount(), 2);
});

test('addPageNumbers applies numbering across pages', async () => {
  const source = await createBlankPdf(3);
  const numbered = await addPageNumbers(source, {
    format: 'Page {n} of {total}',
    position: 'bottom-center',
    fontSize: 10,
    startFrom: 1,
    margin: 20,
  });
  const doc = await PDFDocument.load(numbered);
  assert.equal(doc.getPageCount(), 3);
});

test('createPdfFromText creates formatted document from string', async () => {
  const textPdf = await createPdfFromText('Hello IN TIME PDF Tools!\nThis is a test paragraph.', 'Test Title');
  const doc = await PDFDocument.load(textPdf);
  assert.ok(doc.getPageCount() >= 1);
});

test('compressPdf reduces or maintains clean PDF bytes', async () => {
  const source = await createBlankPdf(2);
  const result = await compressPdf(source, { cleanMetadata: true });
  assert.ok(result.data.length > 0);
  assert.equal(result.originalSize, source.byteLength);
});

test('editMetadata and removeMetadata set and purge metadata fields', async () => {
  const source = await createBlankPdf(1);
  const edited = await editMetadata(source, {
    title: 'Custom Title',
    author: 'Author Name',
  });
  const info = await getPdfInfo(edited);
  assert.equal(info.title, 'Custom Title');
  assert.equal(info.author, 'Author Name');

  const removed = await removeMetadata(edited);
  const clearedInfo = await getPdfInfo(removed);
  assert.equal(clearedInfo.title, undefined);
  assert.equal(clearedInfo.author, undefined);
});
