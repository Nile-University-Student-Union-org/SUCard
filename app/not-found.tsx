import type { Metadata } from "next";
import { NotFoundView } from "@/components/not-found-view";

export const metadata: Metadata = {
  title: "404 — Page Not Found | SU Card",
  description: "The page you are looking for does not exist or has moved.",
};

export default function RootNotFound() {
  return <NotFoundView />;
}
