"use client";

import { useRef, useState, useCallback } from "react";

interface OdometerScannerProps {
  onScan: (reading: number, photoData: string) => void;
  label: string;
}

export default function OdometerScanner({ onScan, label }: OdometerScannerProps) {
  const [open, setOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [captured, setCaptured] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [detected, setDetected] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  async function startCamera() {
    setOpen(true);
    setCaptured(null);
    setDetected(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      setStream(s);
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = s;
      }, 100);
    } catch {
      setOpen(false);
    }
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    setOpen(false);
    setCaptured(null);
    setDetected(null);
    setScanning(false);
  }

  function capture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    const full = canvas.toDataURL("image/jpeg", 0.9);

    // resize for storage (max 640px wide)
    const maxW = 640;
    let w = canvas.width;
    let h = canvas.height;
    if (w > maxW) {
      h = Math.round(h * (maxW / w));
      w = maxW;
    }
    const smallCanvas = document.createElement("canvas");
    smallCanvas.width = w;
    smallCanvas.height = h;
    const sCtx = smallCanvas.getContext("2d");
    if (sCtx) sCtx.drawImage(canvas, 0, 0, w, h);
    const resized = smallCanvas.toDataURL("image/jpeg", 0.7);

    setCaptured(resized);
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);

    runOCR(full);
  }

  async function runOCR(imageData: string) {
    setScanning(true);
    setDetected(null);
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng");
      const { data } = await worker.recognize(imageData);
      await worker.terminate();

      // extract digits from OCR text
      const digits = data.text.replace(/[^0-9]/g, "");
      if (digits.length >= 4) {
        setDetected(digits);
      } else {
        setDetected(null);
      }
    } catch {
      setDetected(null);
    } finally {
      setScanning(false);
    }
  }

  function retake() {
    startCamera();
  }

  function confirm() {
    if (detected && captured) {
      onScan(parseInt(detected), captured);
      stopCamera();
    }
  }

  if (!open) {
    return (
      <button type="button" onClick={startCamera} className="text-accent hover:text-accent-light text-sm font-medium">
        📷 Scan
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-card border border-line rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        <div className="p-4 border-b border-line flex items-center justify-between">
          <span className="font-semibold text-fg">{label}</span>
          <button type="button" onClick={stopCamera} className="text-fg-muted hover:text-fg text-xl leading-none">&times;</button>
        </div>

        <div className="p-4">
          {!captured && (
            <div className="relative">
              <video ref={videoRef} autoPlay playsInline muted className="w-full rounded-lg bg-black" />
              <canvas ref={canvasRef} className="hidden" />
              <p className="text-xs text-fg-muted mt-2 text-center">
                Point the camera at your odometer reading
              </p>
            </div>
          )}

          {captured && (
            <div className="text-center">
              <img src={captured} alt="Captured odometer" className="w-full rounded-lg mb-3" />
              {scanning && (
                <p className="text-sm text-fg-muted animate-pulse">Reading odometer...</p>
              )}
              {!scanning && detected && (
                <div className="bg-accent/10 border border-accent/30 rounded-lg p-3 mb-3">
                  <p className="text-xs text-fg-muted mb-1">Detected reading:</p>
                  <p className="text-2xl font-bold text-accent">{detected}</p>
                </div>
              )}
              {!scanning && !detected && (
                <p className="text-sm text-danger mb-3">Could not read the odometer. Try again with better lighting.</p>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-line flex gap-3 justify-end">
          {captured && !scanning && (
            <>
              <button type="button" onClick={retake} className="px-4 py-2 border border-line rounded-lg text-fg hover:bg-card-hover text-sm">
                Retake
              </button>
              <button type="button" onClick={confirm} disabled={!detected}
                className="px-4 py-2 bg-accent text-on-accent rounded-lg hover:bg-accent-light disabled:opacity-40 text-sm font-medium"
              >
                Confirm
              </button>
            </>
          )}
          {!captured && (
            <button type="button" onClick={capture} className="px-6 py-2 bg-accent text-on-accent rounded-lg hover:bg-accent-light text-sm font-medium">
              Capture
            </button>
          )}
          {scanning && (
            <span className="text-sm text-fg-muted">Processing...</span>
          )}
        </div>
      </div>
    </div>
  );
}
