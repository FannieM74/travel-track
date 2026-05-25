"use client";

import { useRef, useState } from "react";

interface OdometerScannerProps {
  onScan: (reading: number, photoData: string) => void;
  label: string;
}

export default function OdometerScanner({ onScan, label }: OdometerScannerProps) {
  const [open, setOpen] = useState(false);
  const [captured, setCaptured] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [detected, setDetected] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setOpen(true);
    setCaptured(null);
    setDetected(null);

    const reader = new FileReader();
    reader.onload = () => {
      const full = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const maxW = 640;
        let w = img.width;
        let h = img.height;
        if (w > maxW) {
          h = Math.round(h * (maxW / w));
          w = maxW;
        }
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, w, h);
        setCaptured(canvas.toDataURL("image/jpeg", 0.7));
        runOCR(full);
      };
      img.src = full;
    };
    reader.readAsDataURL(file);
  }

  async function runOCR(imageData: string) {
    setScanning(true);
    setDetected(null);
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng");
      const { data } = await worker.recognize(imageData);
      await worker.terminate();

      const digits = data.text.replace(/[^0-9]/g, "");
      setDetected(digits.length >= 4 ? digits : null);
    } catch {
      setDetected(null);
    } finally {
      setScanning(false);
    }
  }

  function retake() {
    setCaptured(null);
    setDetected(null);
    fileRef.current?.click();
  }

  function handleClose() {
    setOpen(false);
    setCaptured(null);
    setDetected(null);
    setScanning(false);
  }

  function confirm() {
    if (detected && captured) {
      onScan(parseInt(detected), captured);
      handleClose();
    }
  }

  return (
    <>
      <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFileSelect} className="hidden" />
      <canvas ref={canvasRef} className="hidden" />

      {!open ? (
        <button type="button" onClick={() => fileRef.current?.click()} className="text-accent hover:text-accent-light text-sm font-medium">
          📷 Scan
        </button>
      ) : (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-card border border-line rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="p-4 border-b border-line flex items-center justify-between">
              <span className="font-semibold text-fg">{label}</span>
              <button type="button" onClick={handleClose} className="text-fg-muted hover:text-fg text-xl leading-none">&times;</button>
            </div>

            <div className="p-4">
              {captured && (
                <div className="text-center">
                  <img src={captured} alt="Odometer photo" className="w-full rounded-lg mb-3" />
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
              {scanning && (
                <span className="text-sm text-fg-muted">Processing...</span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
