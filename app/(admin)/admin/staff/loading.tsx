import { SkeletonPageHeader, SkeletonTable } from "@/components/ui/skeleton";

export default function AdminStaffLoading() {
  return (
    <div
      className="space-y-6 animate-page-enter"
      role="status"
      aria-label="Loading staff accounts"
    >
      <SkeletonPageHeader />
      <SkeletonTable rows={4} columns={6} />
    </div>
  );
}
