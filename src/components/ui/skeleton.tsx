import { cn } from "@/lib/utils/cn";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("bg-cream-dark animate-pulse rounded-md", className)}
      {...props}
    />
  );
}

export { Skeleton };
