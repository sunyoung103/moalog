import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';

interface ToastProps {
  message: string | null;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.96 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 max-w-sm w-auto px-4 py-3 bg-[#202320]/95 text-white text-xs font-semibold rounded-2xl shadow-lg border border-white/10 backdrop-blur-md flex items-center gap-2 pointer-events-none select-none"
        >
          <CheckCircle2 className="w-4 h-4 text-[#c4eb43] shrink-0" />
          <span className="leading-snug">{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
