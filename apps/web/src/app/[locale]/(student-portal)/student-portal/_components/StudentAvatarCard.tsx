import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import React from 'react';

interface StudentAvatarCardProps {
  name: string;
  level: number;
  activeTitle: string | null;
  activeAvatarFrame: string | null;
}

const FRAME_STYLES: Record<string, string> = {
  default: 'ring-2 ring-gray-300',
  gold: 'ring-4 ring-yellow-400 shadow-[0_0_15px_rgba(251,191,36,0.4)]',
  emerald: 'ring-4 ring-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.4)]',
  rainbow: 'ring-4 ring-transparent bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500 p-[3px]',
};

export function StudentAvatarCard({ name, level, activeTitle, activeAvatarFrame }: StudentAvatarCardProps) {
  const t = useTranslations("StudentPortal");
  const initials = name.charAt(0).toUpperCase();
  const frameStyle = FRAME_STYLES[activeAvatarFrame || 'default'] || FRAME_STYLES.default;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 shadow-lg"
    >
      <div className="flex flex-col items-center space-y-4">
        {/* Avatar Circle */}
        <div className={`relative w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold ${frameStyle}`}>
          {activeAvatarFrame === 'rainbow' && (
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
              {initials}
            </div>
          )}
          {activeAvatarFrame !== 'rainbow' && initials}
        </div>

        {/* Name */}
        <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center">
          {name}
        </h2>

        {/* Title Badge */}
        {activeTitle && (
          <div className="bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
            <span>⭐</span>
            <span>{t(`titles.${activeTitle}`, { fallback: activeTitle })}</span>
          </div>
        )}

        {/* Level */}
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t("levelLabel") || "المستوى"} {level}
        </p>
      </div>
    </motion.div>
  );
}