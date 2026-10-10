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
  Keyboard,
  Camera,
  Loader2,
  Building2,
  QrCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal, ModalBody } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import type { ClaimErrorCode } from "@/lib/student/types";

export interface CardScannerProps {
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
  suspended: "Your account is suspended. Please contact the SU office.",
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

  // Manual code entry mode toggle
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualCode, setManualCode] = useState("");

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

  const handleClaim = useCallback(
    async (qrString: string, isManual = false) => {
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
          body: JSON.stringify({ qr: qrString.trim() }),
        });

        const data = await res.json().catch(() => ({}));
        if (!isManual && generation !== cameraGenerationRef.current) return;

        if (!res.ok) {
          const code = (data.code as ClaimErrorCode) || "";
          const message =
            ERROR_MESSAGES[code] ||
            data.error ||
            "Failed to link card. Please try again.";
          setClaimError(message);
          setIsSubmitting(false);

          if (!isManual) {
            // Allow scanning again after 2 seconds
            retryTimerRef.current = setTimeout(() => {
              if (generation === cameraGenerationRef.current) {
                isProcessingRef.current = false;
                scanLoopRef.current = requestAnimationFrame(() => processFrameRef.current());
              }
              retryTimerRef.current = null;
            }, 2000);
          } else {
            isProcessingRef.current = false;
          }
          return;
        }

        // Success
        isSuccessRef.current = true;
        setIsSuccess(true);
        stopCamera();
        const successGeneration = cameraGenerationRef.current;

        // Delay to show celebration
        successTimerRef.current = setTimeout(() => {
          if (!isManual && successGeneration !== cameraGenerationRef.current) return;
          successTimerRef.current = null;
          if (onSuccess) {
            onSuccess();
          } else {
            router.push("/card");
          }
        }, 1800);
      } catch {
        if (!isManual && generation !== cameraGenerationRef.current) return;
        setClaimError("Network error. Please check your connection and try again.");
        setIsSubmitting(false);
        if (!isManual) {
          retryTimerRef.current = setTimeout(() => {
            if (generation === cameraGenerationRef.current) {
              isProcessingRef.current = false;
              scanLoopRef.current = requestAnimationFrame(() => processFrameRef.current());
            }
            retryTimerRef.current = null;
          }, 2000);
        } else {
          isProcessingRef.current = false;
        }
      }
    },
    [stopCamera, onSuccess, router]
  );

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
        "Camera access is not supported on this browser or requires an HTTPS connection."
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
          "Camera permission was denied. Please enable camera access in your browser settings, or enter the card code manually."
        );
      } else if (
        error.name === "NotFoundError" ||
        error.name === "DevicesNotFoundError"
      ) {
        setPermissionError("No camera was found on your device.");
      } else {
        setPermissionError(
          "Could not access camera. Make sure you are on HTTPS, or enter the card code manually."
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

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) {
      setClaimError("Please enter a card code or link.");
      return;
    }
    handleClaim(manualCode.trim(), true);
  };

  useEffect(() => {
    if (!isOpen || showManualEntry) return;

    const timer = setTimeout(() => {
      startCamera();
    }, 0);

    return () => {
      clearTimeout(timer);
      stopCamera();
    };
  }, [isOpen, showManualEntry, startCamera, stopCamera]);

  const handleClose = () => {
    stopCamera();
    setShowManualEntry(false);
    setManualCode("");
    setClaimError(null);
    setPermissionError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Link Physical Card"
      maxWidth="md"
      zIndex="z-[80]"
      showCloseButton={!isSuccess}
      className="bg-card text-card-foreground border-border p-0 overflow-hidden"
    >
      <ModalBody className="p-0 overflow-hidden relative">
        <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

        {isSuccess ? (
          /* Celebration View */
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-5 min-h-[360px] animate-in fade-in zoom-in-95 duration-300 motion-reduce:animate-none">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-2 border-emerald-500/40 flex items-center justify-center shadow-lg animate-bounce motion-reduce:animate-none">
              <CheckCircle2 className="size-10 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="space-y-1.5">
              <h2 className="font-sans font-semibold text-2xl sm:text-3xl text-foreground">
                Card linked!
              </h2>
              <p className="text-sm text-muted-foreground font-medium max-w-xs mx-auto">
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
        ) : showManualEntry || permissionError ? (
          /* Manual Code Entry & Camera Error / Fallback State */
          <div className="p-6 sm:p-8 space-y-5">
            <div className="space-y-2 text-center sm:text-left">
              <div className="w-12 h-12 rounded-2xl bg-brand/10 dark:bg-brand/20 text-brand dark:text-brand-soft flex items-center justify-center mx-auto sm:mx-0 shadow-xs">
                {permissionError ? (
                  <ShieldAlert className="size-6 text-amber-600 dark:text-amber-400" />
                ) : (
                  <Keyboard className="size-6" />
                )}
              </div>
              <h3 className="font-sans font-semibold text-xl text-foreground">
                {permissionError ? "Camera unavailable" : "Enter card code manually"}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-medium">
                {permissionError
                  ? permissionError
                  : "Enter the code or link from the QR code on the back of your card."}
              </p>
            </div>

            {/* Manual input form */}
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <label
                  htmlFor="manual-qr-input"
                  className="text-xs font-semibold text-foreground"
                >
                  Card QR code or link
                </label>
                <Input
                  id="manual-qr-input"
                  type="text"
                  placeholder="e.g. NUSU1:ABC123XYZ or https://..."
                  value={manualCode}
                  onChange={(e) => {
                    setManualCode(e.target.value);
                    if (claimError) setClaimError(null);
                  }}
                  disabled={isSubmitting}
                  className="min-h-[44px] text-sm font-mono"
                  autoFocus
                />
              </div>

              {claimError && (
                <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                  {claimError}
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting || !manualCode.trim()}
                className="w-full font-bold normal-case min-h-[44px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2 motion-reduce:animate-none" />
                    <span>Linking card…</span>
                  </>
                ) : (
                  "Link Card"
                )}
              </Button>
            </form>

            {/* Desk Linking Explanation */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/80 flex items-start gap-2.5 text-xs text-muted-foreground leading-relaxed">
              <Building2 className="size-4 text-brand dark:text-brand-soft shrink-0 mt-0.5" />
              <span>
                <strong className="text-foreground font-semibold">Need desk help? </strong>
                An SU admin can link your card directly at the desk using your Student ID or Card Serial.
              </span>
            </div>

            {/* Navigation actions */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              {!permissionError && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowManualEntry(false);
                    setClaimError(null);
                  }}
                  className="w-full sm:flex-1 normal-case font-bold min-h-[44px]"
                >
                  <Camera className="size-4 mr-1.5" />
                  Use camera scanner
                </Button>
              )}
              {permissionError && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setPermissionError(null);
                    setShowManualEntry(false);
                    startCamera();
                  }}
                  className="w-full sm:flex-1 normal-case font-bold min-h-[44px]"
                >
                  <RotateCcw className="size-4 mr-1.5" />
                  Retry camera
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
                className="w-full sm:w-auto normal-case font-semibold text-muted-foreground hover:text-foreground min-h-[44px]"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          /* Live Camera Viewfinder */
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

            {/* Top Toolbar: Torch, Manual Entry Toggle & Close */}
            <div className="absolute top-3 inset-x-3 flex items-center justify-between z-20">
              <div className="flex items-center gap-2">
                {torchAvailable && (
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
                )}

                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setShowManualEntry(true);
                  }}
                  aria-label="Enter code manually"
                  className="px-3 py-2 rounded-full bg-black/60 text-white hover:bg-black/80 backdrop-blur-md transition-all cursor-pointer min-h-[44px] flex items-center gap-1.5 text-xs font-semibold"
                >
                  <Keyboard className="size-4" />
                  <span className="hidden sm:inline">Enter code</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleClose}
                aria-label="Close scanner"
                className="p-2.5 rounded-full bg-black/60 text-white hover:bg-black/80 backdrop-blur-md transition-all cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Instructions & Status */}
            <div className="absolute bottom-4 inset-x-4 z-20 text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/80 backdrop-blur-md text-xs font-semibold text-white/90 border border-white/10 shadow-lg">
                <QrCode className="size-3.5 shrink-0" />
                <span>
                  {isSubmitting
                    ? "Linking card…"
                    : "Align the QR code on the back of your card inside the frame"}
                </span>
              </div>

              {claimError && (
                <div className="p-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-lg animate-in fade-in duration-200">
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
