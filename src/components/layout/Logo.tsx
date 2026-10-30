import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function Logo({ className, size = "md" }: LogoProps) {
  const sizeClasses = {
    sm: "w-9 h-9",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  const pixelDimensions = {
    sm: 72,
    md: 96,
    lg: 128,
  };

  return (
    <div
      className={cn(
        "relative shrink-0 flex items-center justify-center bg-transparent aspect-square",
        sizeClasses[size],
        className
      )}
    >
      <Image
        src="/logo.png"
        alt="Logo Al-Mubarok"
        width={pixelDimensions[size]}
        height={pixelDimensions[size]}
        priority
        unoptimized
        className="w-full h-full object-contain select-none transition-all duration-300 dark:drop-shadow-[0_0_10px_rgba(34,197,94,0.35)]"
      />
    </div>
  );
}

