"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Star, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import Confetti from "react-confetti";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

// Maps the RecitationQuality enum to Arabic labels
const QUALITY_LABELS: Record<string, string> = {
  EXCELLENT: "ممتاز",
  VERY_GOOD: "جيد جداً",
  GOOD: "جيد",
  ACCEPTABLE: "مقبول",
  POOR: "يحتاج للمزيد من الجهد",
};

interface RecitationRewardModalProps {
  xpAwarded: number;
  quality: string;
  isOpen: boolean;
  onClose: () => void;
}

export function RecitationRewardModal({ xpAwarded, quality, isOpen, onClose }: RecitationRewardModalProps) {
  const [mounted, setMounted] = useState(false);
  const [windowDimension, setWindowDimension] = useState({ width: 0, height: 0 });

  useEffect(() => {
    setMounted(true);
    setWindowDimension({ width: window.innerWidth, height: window.innerHeight });
  }, []);

  if (!mounted) return null;

  const qualityText = QUALITY_LABELS[quality] || "رائع";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-transparent border-none shadow-none text-center flex flex-col items-center justify-center overflow-visible">
        {isOpen && (
          <div className="fixed inset-0 pointer-events-none z-50">
            <Confetti
              width={windowDimension.width}
              height={windowDimension.height}
              recycle={false}
              numberOfPieces={600}
              gravity={0.12}
              colors={['#facc15', '#fef08a', '#eab308', '#ca8a04', '#14b8a6', '#f43f5e']}
            />
          </div>
        )}
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              initial={{ scale: 0.5, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: -20 }}
              transition={{ type: "spring", damping: 15, stiffness: 200 }}
              className="relative z-10 w-full max-w-[320px]"
            >
              {/* Background glow overlay */}
              <div className="absolute inset-0 bg-yellow-400 blur-[100px] rounded-full opacity-50 animate-pulse"></div>
              
              <div className="relative bg-gradient-to-br from-yellow-50 via-white to-yellow-100 p-8 rounded-[2rem] border-2 border-yellow-200 shadow-2xl flex flex-col items-center text-slate-800">
                <Sparkles className="absolute top-6 right-6 h-6 w-6 text-yellow-400 animate-bounce" />
                <Sparkles className="absolute top-1/2 left-4 h-5 w-5 text-yellow-500 animate-pulse" />
                <Sparkles className="absolute bottom-16 right-5 h-4 w-4 text-emerald-400 animate-pulse delay-150" />
                
                {/* Icon Container */}
                <motion.div 
                  initial={{ rotate: -90, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-yellow-400 to-amber-500 shadow-inner mb-6 ring-8 ring-yellow-100/50"
                >
                  <Star className="h-12 w-12 text-white fill-white" />
                </motion.div>
                
                <h2 className="text-3xl font-black mb-3 text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-yellow-600 tracking-tight">مفاجأة!</h2>
                
                <p className="text-slate-600 mb-6 font-semibold leading-relaxed text-lg">
                  أستاذك قيّم تسميعك اليوم بـ<br/>
                  <span className="inline-block mt-2 px-4 py-1.5 bg-yellow-100 text-yellow-800 rounded-full font-bold border border-yellow-200">&quot;{qualityText}&quot; 🌟</span>
                </p>
                
                <div className="bg-gradient-to-b from-amber-500 to-amber-600 rounded-2xl p-5 w-full mb-8 shadow-lg shadow-amber-500/20 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                  <div className="relative text-5xl font-extrabold text-white mb-1 drop-shadow-md">+{xpAwarded}</div>
                  <div className="relative text-sm font-bold uppercase tracking-widest text-amber-100">نقطة خبرة إضافية</div>
                </div>
                
                <Button 
                  size="lg" 
                  className="w-full rounded-2xl bg-slate-900 text-white hover:bg-slate-800 hover:scale-105 active:scale-95 transition-all shadow-xl h-14 text-lg font-bold border-b-4 border-slate-950"
                  onClick={onClose}
                >
                  رائع!
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
