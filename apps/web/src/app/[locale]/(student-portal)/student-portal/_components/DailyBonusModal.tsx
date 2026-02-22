"use client";

import { Gift, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import Confetti from "react-confetti";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface DailyBonusModalProps {
  xpAwarded: number;
  isOpen: boolean;
  onClose: () => void;
}

export function DailyBonusModal({ xpAwarded, isOpen, onClose }: DailyBonusModalProps) {
  const [mounted, setMounted] = useState(false);
  const [windowDimension, setWindowDimension] = useState({ width: 0, height: 0 });

  useEffect(() => {
    setMounted(true);
    setWindowDimension({ width: window.innerWidth, height: window.innerHeight });
  }, []);

  if (!mounted) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-transparent border-none shadow-none text-center flex flex-col items-center justify-center overflow-visible">
        {isOpen && (
          <div className="fixed inset-0 pointer-events-none z-50">
            <Confetti
              width={windowDimension.width}
              height={windowDimension.height}
              recycle={false}
              numberOfPieces={500}
              gravity={0.15}
            />
          </div>
        )}
        <div className="relative animate-in zoom-in-50 duration-500 z-10">
          <div className="absolute inset-0 bg-yellow-400 blur-[80px] rounded-full opacity-60 animate-pulse"></div>
          
          <div className="relative bg-gradient-to-br from-yellow-100 to-yellow-500 p-8 rounded-3xl border border-yellow-300 shadow-2xl flex flex-col items-center text-yellow-950 min-w-[300px]">
            <Sparkles className="absolute top-4 right-4 h-6 w-6 text-yellow-200 animate-bounce" />
            <Sparkles className="absolute bottom-10 left-4 h-5 w-5 text-yellow-200 animate-pulse" />
            
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-yellow-400 shadow-inner mb-6 ring-4 ring-yellow-200">
              <Gift className="h-12 w-12 text-yellow-900" />
            </div>
            
            <h2 className="text-3xl font-black mb-2 tracking-tight">مكافأة الدخول اليومي!</h2>
            <p className="text-yellow-900/80 mb-6 font-medium">عدت مجدداً.. استمر يا بطل!</p>
            
            <div className="bg-yellow-950/10 rounded-2xl p-4 w-full mb-6 max-w-[200px]">
              <div className="text-4xl font-extrabold text-yellow-900">+{xpAwarded}</div>
              <div className="text-sm font-semibold uppercase tracking-widest text-yellow-800/80">نقطة خبرة</div>
            </div>
            
            <Button 
              size="lg" 
              className="w-full rounded-full bg-yellow-950 text-yellow-100 hover:bg-yellow-900 hover:scale-105 transition-all shadow-xl h-14 text-lg font-bold"
              onClick={onClose}
            >
              جمع المكافأة
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
