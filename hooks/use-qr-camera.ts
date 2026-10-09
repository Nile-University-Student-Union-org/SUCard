"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import jsQR from "jsqr";

interface QrDetector {
  detect(video: HTMLVideoElement): Promise<Array<{ rawValue: string }>>;
}

export interface UseQrCameraOptions {
  onScan: (qrCode: string) => void;
  enabled?: boolean;
}

export function useQrCamera({ onScan, enabled = true }: UseQrCameraOptions) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanLoopRef = useRef<number | null>(null);
  const onScanRef = useRef(onScan);
  const enabledRef = useRef(enabled);
  const isScanningRef = useRef(false);
  const cameraGenerationRef = useRef(0);
  const detectorRef = useRef<QrDetector | null>(null);

  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);

  useEffect(() => {
    onScanRef.current = onScan;
    enabledRef.current = enabled;
  }, [onScan, enabled]);

  const stopCamera = useCallback(() => {
    cameraGenerationRef.current++;
    if (scanLoopRef.current) {
      cancelAnimationFrame(scanLoopRef.current);
      scanLoopRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setTorchOn(false);
    setTorchAvailable(false);
    setIsCameraReady(false);
    isScanningRef.current = false;
  }, []);

  const processFrameRef = useRef<() => void>(() => {});

  const processFrame = useCallback(() => {
    const generation = cameraGenerationRef.current;
    if (!videoRef.current || !enabledRef.current) {
      if (scanLoopRef.current !== null) {
        scanLoopRef.current = requestAnimationFrame(() => processFrameRef.current());
      }
      return;
    }

    const video = videoRef.current;
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      // 1. Try native BarcodeDetector if available
      if (typeof window !== "undefined" && "BarcodeDetector" in window) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const detector: QrDetector = detectorRef.current ?? new (window as any).BarcodeDetector({ formats: ["qr_code"] });
          detectorRef.current = detector;
          detector
            .detect(video)
            .then((barcodes: Array<{ rawValue: string }>) => {
              if (generation !== cameraGenerationRef.current) return;
              if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                if (enabledRef.current) {
                  onScanRef.current(barcodes[0].rawValue);
                }
              }
              if (isScanningRef.current) {
                scanLoopRef.current = requestAnimationFrame(() => processFrameRef.current());
              }
            })
            .catch(() => {
              if (generation === cameraGenerationRef.current) runJsQR();
            });
          return;
        } catch {
          runJsQR();
          return;
        }
      } else {
        runJsQR();
        return;
      }
    }

    if (isScanningRef.current) {
      scanLoopRef.current = requestAnimationFrame(() => processFrameRef.current());
    }

    function runJsQR() {
      if (!canvasRef.current || !videoRef.current) {
        if (isScanningRef.current) {
          scanLoopRef.current = requestAnimationFrame(() => processFrameRef.current());
        }
        return;
      }
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        if (isScanningRef.current) {
          scanLoopRef.current = requestAnimationFrame(() => processFrameRef.current());
        }
        return;
      }

      if (video.videoWidth > 0 && video.videoHeight > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code && code.data) {
          if (enabledRef.current) {
            onScanRef.current(code.data);
          }
        }
      }

      if (isScanningRef.current) {
        scanLoopRef.current = requestAnimationFrame(() => processFrameRef.current());
      }
    }
  }, []);

  useEffect(() => {
    processFrameRef.current = processFrame;
  }, [processFrame]);

  const startCamera = useCallback(async () => {
    stopCamera();
    const generation = cameraGenerationRef.current;
    setPermissionError(null);

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setPermissionError(
        "Camera access is not supported on this browser or requires a secure HTTPS connection."
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      if (generation !== cameraGenerationRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
        if (generation !== cameraGenerationRef.current) return;
        setIsCameraReady(true);
      }

      // Check for torch capability
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack && typeof videoTrack.getCapabilities === "function") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const capabilities = videoTrack.getCapabilities() as any;
        if (capabilities?.torch) {
          setTorchAvailable(true);
        }
      }

      isScanningRef.current = true;
      scanLoopRef.current = requestAnimationFrame(() => processFrameRef.current());
    } catch (err: unknown) {
      if (generation !== cameraGenerationRef.current) return;
      stopCamera();
      const error = err as Error;
      if (
        error.name === "NotAllowedError" ||
        error.name === "PermissionDeniedError"
      ) {
        setPermissionError(
          "Camera permission was denied. Please allow camera access in your browser settings to scan cards."
        );
      } else if (
        error.name === "NotFoundError" ||
        error.name === "DevicesNotFoundError"
      ) {
        setPermissionError("No camera device was found on this phone or computer.");
      } else {
        setPermissionError(
          "Could not access camera. Please check camera permissions and ensure you are on HTTPS."
        );
      }
    }
  }, [stopCamera]);

  const toggleTorch = useCallback(async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;

    try {
      const nextTorch = !torchOn;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (track as any).applyConstraints({
        advanced: [{ torch: nextTorch }],
      });
      setTorchOn(nextTorch);
    } catch {
      // Ignore torch error
    }
  }, [torchOn]);

  return {
    videoRef,
    canvasRef,
    permissionError,
    torchAvailable,
    torchOn,
    isCameraReady,
    startCamera,
    stopCamera,
    toggleTorch,
  };
}
