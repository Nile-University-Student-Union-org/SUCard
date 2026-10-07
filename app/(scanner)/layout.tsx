import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "SU Card Scanner",
  description: "Nile University Student Union cashier scanner for partner vendors",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SU Scanner",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0F3056",
};

export default function ScannerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col antialiased">
      {children}
    </div>
  );
}
