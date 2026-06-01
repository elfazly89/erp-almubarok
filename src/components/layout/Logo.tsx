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

  return (
    <div className={cn("rounded-full overflow-hidden flex items-center justify-center bg-transparent shrink-0 shadow-sm border border-outline-variant/20", sizeClasses[size], className)}>
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Premium emerald green circular background */}
        <circle cx="50" cy="50" r="48" fill="#087905" />
        
        {/* Inner thin white circle outline */}
        <circle cx="50" cy="50" r="44.5" stroke="white" strokeWidth="1.5" strokeOpacity="0.9" />
        
        {/* Precise Calligraphic Arabic Letter 'Mim' (م) */}
        <path
          d="M 75.21 27.05 L 78.56 27.38 L 80.90 28.71 L 82.58 30.22 L 86.60 36.06 L 89.28 42.24 L 90.79 49.42 L 90.79 55.76 L 89.78 61.27 L 88.94 62.77 L 86.93 64.44 L 85.59 64.94 L 83.08 64.94 L 74.20 61.94 L 68.17 58.43 L 61.47 52.59 L 60.30 57.26 L 58.46 61.10 L 56.11 64.27 L 52.93 67.28 L 49.41 69.62 L 44.56 71.62 L 40.70 72.29 L 36.85 72.29 L 30.32 70.78 L 26.13 68.61 L 20.77 63.94 L 16.92 58.76 L 16.75 58.26 L 20.27 59.93 L 25.13 61.27 L 32.83 61.77 L 39.53 60.60 L 45.56 58.26 L 50.92 54.76 L 55.28 50.42 L 58.79 45.24 L 60.97 40.23 L 62.81 41.90 L 64.66 37.06 L 68.68 31.22 L 72.03 28.21 L 75.21 27.05 Z M 73.70 38.56 L 75.54 38.56 L 77.05 39.07 L 79.23 40.90 L 80.90 43.07 L 83.92 49.42 L 84.42 51.42 L 83.92 52.92 L 81.57 53.26 L 76.72 51.59 L 71.19 48.75 L 66.16 45.08 L 67.67 42.57 L 69.51 40.73 L 71.52 39.40 L 73.70 38.56 Z"
          fill="white"
          fillRule="evenodd"
        />
      </svg>
    </div>
  );
}
