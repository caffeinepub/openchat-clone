import { AnimatePresence, motion } from "motion/react";

const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

interface ReactionPickerProps {
  visible: boolean;
  onPick: (emoji: string) => void;
  isOwn: boolean;
}

export function ReactionPicker({
  visible,
  onPick,
  isOwn,
}: ReactionPickerProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 4 }}
          transition={{ duration: 0.12, ease: "easeOut" }}
          className={`absolute z-20 bottom-full mb-1.5 flex items-center gap-0.5 bg-card border border-border rounded-full px-2 py-1 shadow-lg ${
            isOwn ? "right-0" : "left-0"
          }`}
          data-ocid="reaction-picker"
        >
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPick(emoji);
              }}
              aria-label={`React with ${emoji}`}
              className="w-8 h-8 flex items-center justify-center text-lg rounded-full hover:bg-muted hover:scale-125 transition-transform duration-100 active:scale-110"
            >
              {emoji}
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
