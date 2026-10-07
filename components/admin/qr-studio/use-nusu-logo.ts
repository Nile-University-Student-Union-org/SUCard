"use client";

import { useEffect, useState } from "react";

let cachedDataUri: string | null = null;
let inFlightPromise: Promise<string> | null = null;

export async function getNusuLogoDataUri(): Promise<string> {
  if (cachedDataUri) return cachedDataUri;
  if (!inFlightPromise) {
    inFlightPromise = (async () => {
      try {
        const res = await fetch("/brand/su-icon-qr.png");
        if (!res.ok) throw new Error("Failed to fetch NUSU logo");
        const blob = await res.blob();
        return await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            cachedDataUri = result;
            resolve(result);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (err) {
        console.warn("Could not load NUSU logo for preview:", err);
        return "";
      } finally {
        inFlightPromise = null;
      }
    })();
  }
  return inFlightPromise;
}

export function useNusuLogo() {
  const [logoDataUri, setLogoDataUri] = useState<string | undefined>(
    cachedDataUri || undefined
  );
  const [isLoading, setIsLoading] = useState(!cachedDataUri);

  useEffect(() => {
    if (cachedDataUri) return;
    let isMounted = true;
    getNusuLogoDataUri().then((uri) => {
      if (isMounted) {
        setLogoDataUri(uri || undefined);
        setIsLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  return { logoDataUri, isLoading };
}
