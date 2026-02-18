
import Image from "next/image";

import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
  showText?: boolean;
}

export function Logo({ 
  className, 
  width = 40, 
  height = 40, 
  showText = false 
}: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative flex items-center justify-center" style={{ width, height }}>
        <Image
          src="/halaqat.png"
          alt="Halaqat Logo"
          fill
          className="object-contain"
          priority
        />
      </div>
      {showText && (
        <span className="text-xl font-bold text-foreground">Halaqat</span>
      )}
    </div>
  );
}
