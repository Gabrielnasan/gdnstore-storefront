import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRating({
  value,
  size = 16,
  className,
  onChange,
}: {
  value: number;
  size?: number;
  className?: string;
  onChange?: (v: number) => void;
}) {
  const interactive = !!onChange;
  return (
    <div className={cn("inline-flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = value >= i;
        const half = !filled && value >= i - 0.5;
        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => onChange?.(i)}
            className={cn("relative", interactive && "cursor-pointer transition-transform hover:scale-110")}
            aria-label={`${i} estrelas`}
          >
            <Star
              width={size}
              height={size}
              className={cn(
                "transition-colors",
                filled ? "fill-yellow-400 text-yellow-400" : half ? "fill-yellow-400/50 text-yellow-400" : "fill-muted text-muted-foreground/40"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
