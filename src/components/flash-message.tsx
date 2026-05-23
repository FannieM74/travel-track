"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";

function FlashMessageInner() {
  const [visible, setVisible] = useState(true);
  const searchParams = useSearchParams();
  const msg = searchParams.get("success");

  useEffect(() => {
    setVisible(true);
  }, [msg]);

  if (!msg || !visible) return null;

  return (
    <div className="mb-4 flex items-center justify-between bg-accent/15 border border-accent/40 rounded-xl px-4 py-3 text-fg">
      <span>{msg}</span>
      <button onClick={() => setVisible(false)} className="ml-3 text-fg-secondary hover:text-fg text-lg leading-none">&times;</button>
    </div>
  );
}

export function FlashMessage() {
  return (
    <Suspense fallback={null}>
      <FlashMessageInner />
    </Suspense>
  );
}
