"use client";

import { useEffect } from "react";

const BACKEND_URL = process.env.NEXT_PUBLIC_SEARCH_BACKEND_URL?.replace(/\\/$/, "");

export function BackendWake() {
  useEffect(() => {
    if (!BACKEND_URL) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const wake = async () => {
      // Free hosting may sleep after inactivity. A browser-originated health
      // request wakes it before the server-side search API needs it.
      for (let attempt = 0; attempt < 24 && !cancelled; attempt += 1) {
        try {
          const response = await fetch(
            `${BACKEND_URL}/healthz?warmup=${Date.now()}`,
            { cache: "no-store", mode: "cors" },
          );
          if (response.ok) return;
        } catch {
          // A sleeping instance may briefly be unreachable while it wakes.
        }

        await new Promise<void>((resolve) => {
          timer = setTimeout(resolve, 1500);
        });
      }
    };

    void wake();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  return null;
}
