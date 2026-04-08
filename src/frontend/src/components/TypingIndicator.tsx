import { AnimatePresence, motion } from "motion/react";
import type { UserProfile } from "../types";

interface TypingIndicatorProps {
  typingUsers: UserProfile[];
}

function formatTypingText(users: UserProfile[]): string {
  if (users.length === 0) return "";
  if (users.length === 1) return `${users[0].displayName} is typing`;
  if (users.length === 2)
    return `${users[0].displayName} and ${users[1].displayName} are typing`;
  const extra = users.length - 2;
  return `${users[0].displayName}, ${users[1].displayName}, and ${extra} other${extra > 1 ? "s" : ""} are typing`;
}

export function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  const isVisible = typingUsers.length > 0;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 6, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: 6, height: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="flex items-center gap-2 px-1 pb-1"
          data-ocid="typing-indicator"
        >
          {/* Animated dots */}
          <div className="flex items-end gap-0.5 h-4">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-primary/60 block"
                animate={{ y: [0, -4, 0] }}
                transition={{
                  duration: 0.6,
                  repeat: Number.POSITIVE_INFINITY,
                  delay: i * 0.15,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
          <span className="text-[13px] text-muted-foreground italic">
            {formatTypingText(typingUsers)}
            <span>…</span>
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
