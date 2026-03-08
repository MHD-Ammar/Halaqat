"use client";

import { motion } from "framer-motion";
import { Gift, Lock, CheckCircle2, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import Confetti from "react-confetti";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useStudentMilestones, useClaimMilestone, StudentMilestone } from "@/hooks/use-student-milestones";
import { soundManager } from "@/lib/sounds";

export function RewardChests() {
  const t = useTranslations("StudentPortal");
  const c = useTranslations("Common");
  const { data: milestones, isLoading } = useStudentMilestones();
  const claimMutation = useClaimMilestone();

  const [celebrationOpen, setCelebrationOpen] = useState(false);
  const [claimedReward, setClaimedReward] = useState<StudentMilestone | null>(null);

  if (isLoading) {
    return <Skeleton className="w-full h-40 rounded-3xl" />;
  }

  // If no milestones configured, hide the section
  if (!milestones || milestones.length === 0) {
    return null;
  }

  const handleClaim = (milestone: StudentMilestone) => {
    claimMutation.mutate(milestone.id, {
      onSuccess: () => {
        void soundManager.play("chestOpen");
        setClaimedReward(milestone);
        setCelebrationOpen(true);
      },
      onError: () => {
        void soundManager.play("error");
      },
    });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
        <Sparkles className="w-6 h-6 text-yellow-500" />
        {t("rewardChests")}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {milestones
          .filter((sm) => sm.milestone) // Defensive guard
          .map((sm) => {
          const isLocked = !sm.unlockedAt;
          const isClaimed = sm.isClaimed;
          const isReady = !isLocked && !isClaimed;

          // Note: In an actual app, we might mix 'locked' generic milestones 
          // that aren't created yet until level up. But since typeORM generates them 
          // dynamically on level up, we might only have unlocked ones. 
          // Wait, the backend creates them *after* reaching the level. 
          // If the user wants to see "يفتح في المستوى X" for locked chests, 
          // the backend API /milestones should return ALL milestones, 
          // joined with student progress. 
          // If the backend only returns *unlocked* milestones, we only render those.
          // Let's assume the API returns all, or if not, we gracefully render what's available.

          return (
            <motion.div
              key={sm.id}
              whileHover={isReady ? { scale: 1.02 } : {}}
              className={`relative rounded-3xl border-2 p-6 flex flex-col items-center justify-center text-center overflow-hidden transition-colors ${
                isClaimed
                  ? "border-green-200 bg-green-50/50 dark:border-green-900/30 dark:bg-green-950/10"
                  : isReady
                  ? "border-yellow-400 bg-gradient-to-br from-yellow-50 to-amber-100 shadow-lg shadow-yellow-500/20 dark:from-yellow-950/30 dark:to-orange-950/10"
                  : "border-gray-200 bg-gray-50/50 dark:border-gray-800 dark:bg-zinc-900/50"
              }`}
            >
              {/* Ready State Pulse Effect */}
              {isReady && (
                <div className="absolute inset-0 bg-yellow-400/10 animate-pulse pointer-events-none" />
              )}

              <div className="relative z-10">
                {isClaimed ? (
                  <div className="flex flex-col items-center">
                    <CheckCircle2 className="w-16 h-16 text-green-500 mb-3" />
                    <h3 className="font-bold text-lg text-green-700 dark:text-green-400">
                      {t("opened")}
                    </h3>
                  </div>
                ) : isReady ? (
                  <div className="flex flex-col items-center">
                     <motion.div
                        animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut", repeatDelay: 1 }}
                     >
                       <Gift className="w-16 h-16 text-yellow-600 dark:text-yellow-400 mb-3 drop-shadow-lg" />
                     </motion.div>
                    <h3 className="font-bold text-lg text-yellow-800 dark:text-yellow-200 mb-4">
                      {sm.milestone?.title || t("chest")}
                    </h3>
                    <Button 
                      onClick={() => handleClaim(sm)} 
                      disabled={claimMutation.isPending}
                      className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-md font-bold rounded-xl"
                    >
                      {claimMutation.isPending ? t("opening") : t("openChest")}
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center opacity-70">
                    <Lock className="w-16 h-16 text-gray-400 mb-3" />
                    <h3 className="font-semibold text-gray-600 dark:text-gray-300">
                      {t("unlockedAtLevel", { level: sm.milestone?.targetLevel })}
                    </h3>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <Dialog open={celebrationOpen} onOpenChange={setCelebrationOpen}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-950 text-white border-0 shadow-2xl overflow-hidden p-8 rounded-3xl">
          {celebrationOpen && (
            <Confetti
              width={window.innerWidth}
              height={window.innerHeight}
              recycle={false}
              numberOfPieces={500}
              gravity={0.15}
              style={{ position: 'fixed', inset: 0, zIndex: 100 }}
            />
          )}
          <DialogHeader className="text-center pb-4 relative z-10 flex flex-col items-center">
             <div className="w-24 h-24 bg-yellow-400/20 rounded-full flex items-center justify-center mb-4 shadow-[0_0_50px_-10px_rgba(250,204,21,0.5)]">
               <Gift className="w-12 h-12 text-yellow-400" />
             </div>
             <DialogTitle className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-500 mb-2">
              {t("congratulations")}
            </DialogTitle>
            <DialogDescription className="text-lg text-indigo-100 flex flex-col items-center gap-2">
              <span>{t("claimedRewardMessage", { title: claimedReward?.milestone?.title || t("reward") })}</span>
              {claimedReward?.milestone?.rewardType === "BONUS_XP" && (
                <span className="bg-white/10 px-4 py-2 rounded-xl mt-2 font-black text-2xl text-yellow-300 backdrop-blur-sm border border-white/10">
                  +{claimedReward?.milestone?.rewardValue} XP
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center mt-6 relative z-10">
             <Button
                onClick={() => setCelebrationOpen(false)}
                className="w-full bg-white text-indigo-900 hover:bg-gray-100 font-bold rounded-xl h-12 text-lg"
             >
               {c("continue")}
             </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
