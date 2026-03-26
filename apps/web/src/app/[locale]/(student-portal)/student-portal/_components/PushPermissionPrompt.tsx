"use client";

import { BellRing, X } from "lucide-react";
import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { requestPushPermission, subscribeToPush } from "@/lib/push-notifications";


export function PushPermissionPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if we should show the prompt
    if (typeof window === "undefined") return;
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;

    if (Notification.permission === "granted") return;
    if (Notification.permission === "denied") return;

    const hideUntil = localStorage.getItem("halaqat-hide-push-prompt");
    if (hideUntil && new Date().getTime() < parseInt(hideUntil, 10)) {
      return;
    }

    setShow(true);
  }, []);

  const handleSubscribe = async () => {
    setShow(false);
    const granted = await requestPushPermission();
    if (granted) {
      if (!process.env.NEXT_PUBLIC_VAPID_KEY) {
        console.error("Missing NEXT_PUBLIC_VAPID_KEY");
        return;
      }
      try {
        await subscribeToPush(process.env.NEXT_PUBLIC_VAPID_KEY);
      } catch (err) {
        console.error("Failed to subscribe to push", err);
      }
    }
  };

  const handleDismiss = () => {
    setShow(false);
    // Hide for 7 days
    const hideUntil = new Date().getTime() + 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem("halaqat-hide-push-prompt", hideUntil.toString());
  };

  if (!show) return null;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4 mb-6 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full mix-blend-multiply opacity-50 blur-2xl transform translate-x-10 -translate-y-10"></div>
      
      <button 
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 transition-colors z-10"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-4 relative z-10">
        <div className="bg-blue-100 p-2.5 rounded-full text-blue-600 shrink-0">
          <BellRing className="h-5 w-5" />
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900 mb-1">
            هل تريد أن نذكرك بمهام اليوم؟
          </h3>
          <p className="text-sm text-slate-600 mb-4 leading-relaxed">
            سنرسل إشعارات قبل انتهاء اليوم لحماية سلسلتك من الضياع ومتابعة تقدمك المستمر.
          </p>
          
          <div className="flex items-center gap-3">
            <Button 
              size="sm" 
              onClick={handleSubscribe}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-5"
            >
              نعم، ذكّرني!
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={handleDismiss}
              className="text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full"
            >
              لاحقاً
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
