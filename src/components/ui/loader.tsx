
import { cn } from "@/lib/utils";

export function ThreeBarLoader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center justify-center gap-1", className)} {...props}>
      <span className="h-8 w-1.5 animate-bar-loader [animation-delay:-0.3s] rounded-full bg-gradient-to-t from-blue-500 to-purple-500" />
      <span className="h-8 w-1.5 animate-bar-loader [animation-delay:-0.15s] rounded-full bg-gradient-to-t from-blue-500 to-purple-500" />
      <span className="h-8 w-1.5 animate-bar-loader rounded-full bg-gradient-to-t from-blue-500 to-purple-500" />
    </div>
  );
}
