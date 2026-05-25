#!/usr/bin/env tsx
import sharp from "sharp";
import { createWorker } from "tesseract.js";
import * as fs from "fs";
import * as path from "path";

const ROOT = import.meta.dirname ? path.resolve(import.meta.dirname, "..") : process.cwd();

const IMAGES_DIR = path.join(ROOT, "data/6y8m379mkt-2/trodo-v01/trodo-v01/images");
const ANNOTATIONS_DIR = path.join(ROOT, "data/6y8m379mkt-2/trodo-v01/trodo-v01/pascal voc 1.1/Annotations");
const GROUND_TRUTH = path.join(ROOT, "data/6y8m379mkt-2/trodo-v01/trodo-v01/ground truth/groundtruth.json");
const RESULTS_DIR = path.join(ROOT, "data");

const args = process.argv.slice(2);
const SAMPLE = parseInt(args.find((a) => a.startsWith("--sample="))?.split("=")[1] || "0", 10);
const MAX_WIDTH = parseInt(args.find((a) => a.startsWith("--width="))?.split("=")[1] || "640", 10);
const CONCURRENCY = parseInt(args.find((a) => a.startsWith("--concurrency="))?.split("=")[1] || "2", 10);
const CROP = args.includes("--crop");
const RESUME = args.includes("--resume");
const TAG = CROP ? "cropped" : "full";

interface GroundTruthEntry {
  image: string;
  odometer_type: string;
  mileage: string;
}

interface Result {
  image: string;
  groundTruth: string;
  detected: string | null;
  exactMatch: boolean;
  odometerType: string;
  error: string | null;
}

interface CropBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

function loadGroundTruth(): GroundTruthEntry[] {
  const raw = JSON.parse(fs.readFileSync(GROUND_TRUTH, "utf-8"));
  return (raw.odometers as GroundTruthEntry[]).sort((a, b) => a.image.localeCompare(b.image));
}

function loadCheckpoint(filePath: string): Result[] {
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, "utf-8").trim();
  if (!raw) return [];
  return raw.split("\n").map((l) => JSON.parse(l));
}

function saveCheckpoint(filePath: string, result: Result) {
  fs.appendFileSync(filePath, JSON.stringify(result) + "\n");
}

function parseOdometerBox(imageName: string): CropBox | null {
  const xmlName = imageName.replace(/\.jpg$/i, ".xml");
  const xmlPath = path.join(ANNOTATIONS_DIR, xmlName);
  if (!fs.existsSync(xmlPath)) return null;

  const xml = fs.readFileSync(xmlPath, "utf-8");
  const m = xml.match(
    /<object>[\s\S]*?<name>odometer<\/name>[\s\S]*?<bndbox>[\s\S]*?<xmin>([\d.]+)<\/xmin>[\s\S]*?<ymin>([\d.]+)<\/ymin>[\s\S]*?<xmax>([\d.]+)<\/xmax>[\s\S]*?<ymax>([\d.]+)<\/ymax>/
  );
  if (!m) return null;

  return {
    left: Math.round(parseFloat(m[1])),
    top: Math.round(parseFloat(m[2])),
    width: Math.round(parseFloat(m[3]) - parseFloat(m[1])),
    height: Math.round(parseFloat(m[4]) - parseFloat(m[2])),
  };
}

async function loadAndPrepareImage(filePath: string, crop: CropBox | null, maxWidth: number): Promise<Buffer> {
  let pipeline = sharp(filePath);

  if (crop) {
    pipeline = pipeline.extract({
      left: crop.left,
      top: crop.top,
      width: crop.width,
      height: crop.height,
    });
  }

  return pipeline.resize({ width: maxWidth, withoutEnlargement: true }).jpeg({ quality: 70 }).toBuffer();
}

function bufferToDataUrl(buf: Buffer): string {
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
}

async function extractDigits(imageData: string): Promise<string | null> {
  const worker = await createWorker("eng");
  const { data } = await worker.recognize(imageData);
  await worker.terminate();
  const digits = data.text.replace(/[^0-9]/g, "");
  return digits.length >= 4 ? digits : null;
}

async function processOne(entry: GroundTruthEntry, imagesDir: string, maxWidth: number, crop: boolean): Promise<Result> {
  const filePath = path.join(imagesDir, entry.image);
  if (!fs.existsSync(filePath)) {
    return { image: entry.image, groundTruth: entry.mileage, detected: null, exactMatch: false, odometerType: entry.odometer_type, error: "file not found" };
  }
  try {
    const odometerBox = crop ? parseOdometerBox(entry.image) : null;
    const buf = await loadAndPrepareImage(filePath, odometerBox, maxWidth);
    const dataUrl = bufferToDataUrl(buf);
    const detected = await extractDigits(dataUrl);
    return {
      image: entry.image,
      groundTruth: entry.mileage,
      detected,
      exactMatch: detected === entry.mileage,
      odometerType: entry.odometer_type,
      error: null,
    };
  } catch (err) {
    return { image: entry.image, groundTruth: entry.mileage, detected: null, exactMatch: false, odometerType: entry.odometer_type, error: String(err) };
  }
}

async function processAll(
  entries: GroundTruthEntry[],
  imagesDir: string,
  maxWidth: number,
  concurrency: number,
  checkpointPath: string,
  existing: Map<string, Result>,
  crop: boolean
): Promise<Result[]> {
  const results: Result[] = Array.from(existing.values());
  const queue = entries.filter((e) => !existing.has(e.image));
  let index = 0;
  const total = queue.length;

  if (total === 0) {
    console.log("All images already processed. Skipping.");
    return results;
  }

  console.log(`Processing ${total} images (${existing.size} already done) with ${concurrency} workers, ${maxWidth}px max width, crop=${crop}...`);

  async function workerTask(): Promise<void> {
    while (true) {
      const i = index++;
      if (i >= queue.length) break;
      const entry = queue[i];
      const result = await processOne(entry, imagesDir, maxWidth, crop);
      results.push(result);
      saveCheckpoint(checkpointPath, result);
      const pct = ((i + 1) / total * 100).toFixed(1);
      const match = result.exactMatch ? "✓" : result.detected ? "~" : "✗";
      console.log(`[${pct}%] ${match} ${entry.image} → gt=${entry.mileage} detected=${result.detected}${result.error ? ` err=${result.error}` : ""}`);
    }
  }

  const workers: Promise<void>[] = [];
  for (let i = 0; i < concurrency; i++) {
    workers.push(workerTask());
  }
  await Promise.all(workers);

  return results;
}

function computeStats(results: Result[], tag: string, maxWidth: number, concurrency: number): void {
  const total = results.length;
  const exactMatches = results.filter((r) => r.exactMatch).length;
  const withDetection = results.filter((r) => r.detected !== null).length;
  const noDetection = results.filter((r) => r.detected === null && !r.error).length;
  const errors = results.filter((r) => r.error !== null).length;
  const exactRate = total > 0 ? (exactMatches / total * 100).toFixed(1) : "0.0";
  const detectRate = total > 0 ? (withDetection / total * 100).toFixed(1) : "0.0";

  const partialMatches1 = results.filter((r) => {
    if (!r.detected) return false;
    const diff = Math.abs(parseInt(r.detected) - parseInt(r.groundTruth));
    return diff > 0 && diff <= 1;
  }).length;
  const partialMatches10 = results.filter((r) => {
    if (!r.detected) return false;
    const diff = Math.abs(parseInt(r.detected) - parseInt(r.groundTruth));
    return diff > 1 && diff <= 10;
  }).length;
  const partialMatches100 = results.filter((r) => {
    if (!r.detected) return false;
    const diff = Math.abs(parseInt(r.detected) - parseInt(r.groundTruth));
    return diff > 10 && diff <= 100;
  }).length;
  const farOff = results.filter((r) => {
    if (!r.detected) return false;
    const diff = Math.abs(parseInt(r.detected) - parseInt(r.groundTruth));
    return diff > 100;
  }).length;

  let totalAbsError = 0;
  let closeCount = 0;
  for (const r of results) {
    if (r.detected) {
      totalAbsError += Math.abs(parseInt(r.detected) - parseInt(r.groundTruth));
      closeCount++;
    }
  }
  const meanAbsError = closeCount > 0 ? (totalAbsError / closeCount).toFixed(1) : "N/A";

  const analogResults = results.filter((r) => r.odometerType === "analog");
  const digitalResults = results.filter((r) => r.odometerType === "digital");
  const analogExact = analogResults.filter((r) => r.exactMatch).length;
  const digitalExact = digitalResults.filter((r) => r.exactMatch).length;
  const analogRate = analogResults.length > 0 ? (analogExact / analogResults.length * 100).toFixed(1) : "0.0";
  const digitalRate = digitalResults.length > 0 ? (digitalExact / digitalResults.length * 100).toFixed(1) : "0.0";

  const digitErrors: Record<string, { total: number; errors: number; confusion: Record<string, number> }> = {};
  for (const r of results) {
    if (r.detected && !r.exactMatch) {
      const gt = r.groundTruth.padStart(Math.max(r.groundTruth.length, r.detected.length), "0");
      const det = r.detected.padStart(gt.length, "0");
      for (let i = 0; i < gt.length; i++) {
        const expected = gt[i];
        const actual = det[i] || "?";
        if (expected !== actual) {
          if (!digitErrors[expected]) digitErrors[expected] = { total: 0, errors: 0, confusion: {} };
          digitErrors[expected].total++;
          digitErrors[expected].errors++;
          digitErrors[expected].confusion[actual] = (digitErrors[expected].confusion[actual] || 0) + 1;
        }
      }
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`BATCH OCR ACCURACY REPORT — ${tag.toUpperCase()}`);
  console.log("=".repeat(60));
  console.log(`Total images:          ${total}`);
  console.log(`Resize width:          ${maxWidth}px`);
  console.log(`Crop to odometer:      ${tag === "cropped" ? "YES" : "NO"}`);
  console.log(`Exact matches:         ${exactMatches} / ${total} (${exactRate}%)`);
  console.log(`Within 1 unit:         ${exactMatches + partialMatches1} / ${total} (${((exactMatches + partialMatches1) / total * 100).toFixed(1)}%)`);
  console.log(`Within 10 units:       ${exactMatches + partialMatches1 + partialMatches10} / ${total} (${((exactMatches + partialMatches1 + partialMatches10) / total * 100).toFixed(1)}%)`);
  console.log(`Within 100 units:      ${exactMatches + partialMatches1 + partialMatches10 + partialMatches100} / ${total} (${((exactMatches + partialMatches1 + partialMatches10 + partialMatches100) / total * 100).toFixed(1)}%)`);
  console.log(`Far off (>100 units):  ${farOff}`);
  console.log(`Detected (any digits): ${withDetection} / ${total} (${detectRate}%)`);
  console.log(`No detection:          ${noDetection}`);
  console.log(`Errors:                ${errors}`);
  console.log(`Mean abs error:        ${meanAbsError}`);
  console.log();
  console.log("--- By odometer type ---");
  console.log(`Analog:  ${analogExact}/${analogResults.length} (${analogRate}%)`);
  console.log(`Digital: ${digitalExact}/${digitalResults.length} (${digitalRate}%)`);
  console.log();
  console.log("--- Digit confusion matrix (top errors) ---");
  for (const [expected, stats] of Object.entries(digitErrors)) {
    const topConfusion = Object.entries(stats.confusion)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([k, v]) => `${k}=${v}`)
      .join(", ");
    console.log(`  Digit '${expected}': ${stats.errors} errors — ${topConfusion}`);
  }

  const summaryPath = path.join(RESULTS_DIR, `batch-ocr-summary-${tag}.json`);
  const summary = {
    config: { crop: tag === "cropped", resizeWidth: maxWidth, concurrency },
    total,
    exactMatches,
    exactRate: parseFloat(exactRate),
    detectRate: parseFloat(detectRate),
    analogExact: analogResults.length > 0 ? parseFloat(analogRate) : null,
    digitalExact: digitalResults.length > 0 ? parseFloat(digitalRate) : null,
    meanAbsError: meanAbsError !== "N/A" ? parseFloat(meanAbsError) : null,
    digitErrors,
  };
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  console.log(`\nSummary saved to: ${summaryPath}`);
}

async function main() {
  if (!fs.existsSync(IMAGES_DIR)) {
    console.error(`Images directory not found: ${IMAGES_DIR}`);
    process.exit(1);
  }
  if (!fs.existsSync(GROUND_TRUTH)) {
    console.error(`Ground truth not found: ${GROUND_TRUTH}`);
    process.exit(1);
  }

  if (!fs.existsSync(RESULTS_DIR)) {
    fs.mkdirSync(RESULTS_DIR, { recursive: true });
  }

  const allEntries = loadGroundTruth();
  const totalImages = fs.readdirSync(IMAGES_DIR).filter((f) => f.endsWith(".jpg")).length;
  console.log(`Found ${allEntries.length} ground truth entries, ${totalImages} images`);
  console.log(`Mode: ${CROP ? "crop-to-odometer" : "full-image"}, width=${MAX_WIDTH}px, concurrency=${CONCURRENCY}${RESUME ? " (resume)" : ""}`);

  let entries = allEntries;
  if (SAMPLE > 0) {
    entries = allEntries.slice(0, Math.min(SAMPLE, allEntries.length));
    console.log(`SAMPLE mode: first ${entries.length} images`);
  }

  const checkpointFile = path.join(RESULTS_DIR, `batch-ocr-checkpoint-${TAG}-${MAX_WIDTH}px.jsonl`);
  const existingResults = RESUME ? loadCheckpoint(checkpointFile) : [];
  const existingMap = new Map(existingResults.map((r) => [r.image, r]));
  if (existingResults.length > 0) {
    console.log(`Loaded ${existingResults.length} existing results from checkpoint`);
  }

  const results = await processAll(entries, IMAGES_DIR, MAX_WIDTH, CONCURRENCY, checkpointFile, existingMap, CROP);

  const finalResultsPath = path.join(RESULTS_DIR, `batch-ocr-results-${TAG}-${MAX_WIDTH}px.json`);
  fs.writeFileSync(finalResultsPath, JSON.stringify(results, null, 2));
  console.log(`\nAll results saved to: ${finalResultsPath}`);

  computeStats(results, TAG, MAX_WIDTH, CONCURRENCY);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
