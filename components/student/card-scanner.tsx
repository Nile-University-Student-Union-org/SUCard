"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import jsQR from "jsqr";
import {
  Flashlight,
  FlashlightOff,
  X,
  RotateCcw,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal, ModalBody } from "@/components/ui/modal";
import { cn } from "cn";
import type { ClaimErrorCode } from "@/lib/student/types";

interface CardScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const ERROR_MESSAGES: Record<ClaimErrorCode | string, string> = {
  not_su_card: "This isn't an SU Card",
  already_linked: "This card is already linked to another account — return it to SU",
  cancelled: "This card was cancelled — get a new one at SU",
  already_has_card: "You already have an SU Card",
  rate_limited: "Too many attempts. Try again in an hour.",
  invalid_qr: "That QR code isn't an SU Card",
};

export function CardScanner({ isOpen, onClose, onSuccess }: CardScannerProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanLoopRef = useRef<number | null>(null);
  const processFrameRef = useRef<() => void>(() => {});
  const isProcessingRef = useRef(false);
  const isSuccessRef = useRef(false);
  const cameraGenerationRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Stop camera media tracks
  const stopCamera = useCallback(() => {
    cameraGenerationRef.current++;
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
    retryTimerRef.current = null;
    successTimerRef.current = null;
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
  }, []);

  const handleClaim = useCallback(async (qrString: string) => {
    if (isProcessingRef.current) return;
    const generation = cameraGenerationRef.current;
    isProcessingRef.current = true;
    setIsSubmitting(true);
    setClaimError(null);

    try {
      const res = await fetch("/api/student/card/claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ qr: qrString }),
      });

      const data = await res.json().catch(() => ({}));
      if (generation !== cameraGenerationRef.current) return;

      if (!res.ok) {
        const code = (data.code as ClaimErrorCode) || "";
        const message =
          ERROR_MESSAGES[code] ||
          data.error ||
          "Failed to link card. Please try again.";
        setClaimError(message);
        setIsSubmitting(false);
        // Allow scanning again after 2 seconds
        retryTimerRef.current = setTimeout(() => {
          if (generation === cameraGenerationRef.current) {
            isProcessingRef.current = false;
            scanLoopRef.current = requestAnimationFrame(() => processFrameRef.current());
          }
          retryTimerRef.current = null;
        }, 2000);
        return;
      }

      // Success
      isSuccessRef.current = true;
      setIsSuccess(true);
      stopCamera();
      const successGeneration = cameraGenerationRef.current;

      // Delay to show celebration
      successTimerRef.current = setTimeout(() => {
        if (successGeneration !== cameraGenerationRef.current) return;
        successTimerRef.current = null;
        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/card");
        }
      }, 1800);
    } catch {
      if (generation !== cameraGenerationRef.current) return;
      setClaimError("Network error. Please check your connection and try again.");
      setIsSubmitting(false);
      retryTimerRef.current = setTimeout(() => {
        if (generation === cameraGenerationRef.current) {
          isProcessingRef.current = false;
          scanLoopRef.current = requestAnimationFrame(() => processFrameRef.current());
        }
        retryTimerRef.current = null;
      }, 2000);
    }
  }, [stopCamera, onSuccess, router]);

  const processFrame = useCallback(() => {
    const generation = cameraGenerationRef.current;
    if (!videoRef.current || isProcessingRef.current || isSuccessRef.current) return;

    const video = videoRef.current;
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      // 1. Try native BarcodeDetector if available
      if (typeof window !== "undefined" && "BarcodeDetector" in window) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const detector = new (window as any).BarcodeDetector({
            formats: ["qr_code"],
          });
          detector
            .detect(video)
            .then((barcodes: Array<{ rawValue: string }>) => {
              if (generation !== cameraGenerationRef.current) return;
              if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                handleClaim(barcodes[0].rawValue);
              } else if (!isSuccessRef.current) {
                scanLoopRef.current = requestAnimationFrame(() => {
                  processFrameRef.current();
                });
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

    if (!isSuccessRef.current) {
      scanLoopRef.current = requestAnimationFrame(() => {
        processFrameRef.current();
      });
    }

    function runJsQR() {
      if (!canvasRef.current || !videoRef.current) {
        if (!isSuccessRef.current) {
          scanLoopRef.current = requestAnimationFrame(() => {
            processFrameRef.current();
          });
        }
        return;
      }
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        if (!isSuccessRef.current) {
          scanLoopRef.current = requestAnimationFrame(() => {
            processFrameRef.current();
          });
        }
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (code && code.data) {
        handleClaim(code.data);
      } else if (!isSuccessRef.current) {
        scanLoopRef.current = requestAnimationFrame(() => {
          processFrameRef.current();
        });
      }
    }
  }, [handleClaim]);

  useEffect(() => {
    processFrameRef.current = processFrame;
  }, [processFrame]);

  // Start camera
  const startCamera = useCallback(async () => {
    stopCamera();
    const generation = cameraGenerationRef.current;
    isProcessingRef.current = false;
    isSuccessRef.current = false;
    setIsSuccess(false);
    setIsSubmitting(false);
    setClaimError(null);
    setPermissionError(null);

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setPermissionError(
        "Camera access is not supported on this browser or requires an HTTPS connection. Ask an SU admin to link your card at the desk."
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
      }
      if (generation !== cameraGenerationRef.current) return;

      // Check for torch capability
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack && typeof videoTrack.getCapabilities === "function") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const capabilities = videoTrack.getCapabilities() as any;
        if (capabilities?.torch) {
          setTorchAvailable(true);
        }
      }

      // Start scan loop
      scanLoopRef.current = requestAnimationFrame(() => {
        processFrameRef.current();
      });
    } catch (err: unknown) {
      if (generation !== cameraGenerationRef.current) return;
      stopCamera();
      const error = err as Error;
      if (
        error.name === "NotAllowedError" ||
        error.name === "PermissionDeniedError"
      ) {
        setPermissionError(
          "Camera permission was denied. Please enable camera access in your browser settings, or ask an SU admin to link your card at the desk."
        );
      } else if (
        error.name === "NotFoundError" ||
        error.name === "DevicesNotFoundError"
      ) {
        setPermissionError(
          "No camera was found on your device. Ask an SU admin to link your card at the desk."
        );
      } else {
        setPermissionError(
          "Could not access camera. Make sure you are on HTTPS, or ask an SU admin to link your card at the desk."
        );
      }
    }
  }, [stopCamera]);

  // Toggle torch
  const toggleTorch = async () => {
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
  };

  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      startCamera();
    }, 0);

    return () => {
      clearTimeout(timer);
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        stopCamera();
        onClose();
      }}
      title="Link Physical Card"
      maxWidth="md"
      zIndex="z-[80]"
      showCloseButton={!isSuccess}
      className="bg-zinc-950 text-white border-zinc-800 p-0 overflow-hidden"
    >
      <ModalBody className="p-0 overflow-hidden relative">
        <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

        {isSuccess ? (
          /* Celebration View */
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-5 min-h-[360px] animate-in fade-in zoom-in-95 duration-300 motion-reduce:animate-none">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/40 flex items-center justify-center shadow-lg animate-bounce motion-reduce:animate-none">
              <CheckCircle2 className="size-10 text-emerald-400" />
            </div>
            <div className="space-y-1.5">
              <h2 className="font-sans font-semibold text-2xl sm:text-3xl text-white">
                Card linked!
              </h2>
              <p className="text-sm text-zinc-300 font-medium max-w-xs mx-auto">
                Your physical membership card is now active and ready to use.
              </p>
            </div>
            <div className="pt-2">
              <Button
                variant="primary"
                onClick={() => {
                  stopCamera();
                  if (onSuccess) onSuccess();
                  else router.push("/card");
                }}
                className="font-bold min-h-[44px] normal-case"
              >
                View My Card
              </Button>
            </div>
          </div>
        ) : permissionError ? (
          /* Permission Error State */
          <div className="p-6 sm:p-8 space-y-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
              <ShieldAlert className="size-7" />
            </div>
            <div className="space-y-2">
              <h3 className="font-sans font-semibold text-xl text-white">
                Camera unavailable
              </h3>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-xs mx-auto font-medium">
                {permissionError}
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setPermissionError(null);
                  startCamera();
                }}
                className="w-full normal-case font-bold min-h-[44px]"
              >
                <RotateCcw className="size-4 mr-2" />
                Try again
              </Button>
              <Button
                variant="ghost"
                onClick={() => { stopCamera(); onClose(); }}
                className="w-full normal-case font-semibold text-zinc-400 hover:text-white min-h-[44px]"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          /* Camera Viewfinder */
          <div className="relative w-full aspect-square max-h-[400px] sm:max-h-[450px] bg-black overflow-hidden flex items-center justify-center">
            {/* Live Video Feed */}
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              muted
              playsInline
            />

            {/* Darkened Vignette Overlay */}
            <div className="absolute inset-0 bg-black/40 pointer-events-none" />

            {/* Viewfinder Target Box */}
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-2xl border-2 border-white/20 flex items-center justify-center shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
              {/* 4 Corner Brackets */}
              <div className="absolute top-0 left-0 w-7 h-7 border-t-4 border-l-4 border-[#018BCE] rounded-tl-xl -mt-1 -ml-1" />
              <div className="absolute top-0 right-0 w-7 h-7 border-t-4 border-r-4 border-[#018BCE] rounded-tr-xl -mt-1 -mr-1" />
              <div className="absolute bottom-0 left-0 w-7 h-7 border-b-4 border-l-4 border-[#018BCE] rounded-bl-xl -mb-1 -ml-1" />
              <div className="absolute bottom-0 right-0 w-7 h-7 border-b-4 border-r-4 border-[#018BCE] rounded-br-xl -mb-1 -mr-1" />

              {/* Scanning Laser Beam Animation */}
              <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-[#018BCE] to-transparent shadow-[0_0_12px_#018BCE] animate-pulse motion-reduce:animate-none" />
            </div>

            {/* Top Toolbar: Torch & Close */}
            <div className="absolute top-3 inset-x-3 flex items-center justify-between z-20">
              {torchAvailable ? (
                <button
                  type="button"
                  onClick={toggleTorch}
                  aria-label={torchOn ? "Turn off flashlight" : "Turn on flashlight"}
                  className={cn(
                    "p-2.5 rounded-full backdrop-blur-md transition-all cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center",
                    torchOn
                      ? "bg-amber-400 text-black shadow-lg"
                      : "bg-black/60 text-white hover:bg-black/80"
                  )}
                >
                  {torchOn ? (
                    <Flashlight className="size-5 fill-current" />
                  ) : (
                    <FlashlightOff className="size-5" />
                  )}
                </button>
              ) : (
                <div />
              )}

              <button
                type="button"
                onClick={() => { stopCamera(); onClose(); }}
                aria-label="Close scanner"
                className="p-2.5 rounded-full bg-black/60 text-white hover:bg-black/80 backdrop-blur-md transition-all cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Instructions & Status */}
            <div className="absolute bottom-4 inset-x-4 z-20 text-center space-y-2">
              <div className="inline-block px-3.5 py-1.5 rounded-full bg-black/80 backdrop-blur-md text-xs font-semibold text-white/90 border border-white/10 shadow-lg">
                {isSubmitting
                  ? "Linking card…"
                  : "Align the QR code on the back of your card inside the frame"}
              </div>

              {claimError && (
                <div className="p-2 rounded-xl bg-rose-500/90 text-white text-xs font-bold shadow-lg animate-in fade-in duration-200">
                  {claimError}
                </div>
              )}
            </div>
          </div>
        )}
      </ModalBody>
    </Modal>
  );
}
