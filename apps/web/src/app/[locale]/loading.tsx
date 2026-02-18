
import { Loader2 } from "lucide-react";
import Image from "next/image";

export default function Loading() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background gap-4">
      <div className="relative w-16 h-16 animate-pulse">
        <Image
          src="/halaqat.png"
          alt="Loading..."
          fill
          className="object-contain"
          priority
        />
      </div>
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}
