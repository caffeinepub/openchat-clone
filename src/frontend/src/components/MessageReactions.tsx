import { AnimatePresence, motion } from "motion/react";
import type { ReactionGroup, UserId } from "../types";

interface MessageReactionsProps {
  reactions: ReactionGroup[];
  currentUserId: UserId;
  onToggle: (emoji: string, hasReacted: boolean) => void;
  isOwn: boolean;
}

export function MessageReactions({
  reactions,
  currentUserId,
  onToggle,
  isOwn,
}: MessageReactionsProps) {
  if (!reactions.length) return null;

  return (
    <div
      className={`flex flex-wrap gap-1 mt-1 ${isOwn ? "justify-end" : "justify-start"}`}
      data-ocid="message-reactions"
    >
      <AnimatePresence initial={false}>
        {reactions.map((group) => {
          const hasReacted = group.userIds.includes(currentUserId);
          return (
            <motion.button
              key={group.emoji}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.15, ease: "backOut" }}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggle(group.emoji, hasReacted);
              }}
              aria-label={`${group.emoji} ${group.count} reaction${group.count !== 1 ? "s" : ""}`}
              data-ocid="reaction-pill"
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[13px] border transition-colors-fast select-none ${
                hasReacted
                  ? "bg-primary/20 border-primary/40 text-primary font-medium"
                  : "bg-muted/60 border-border/60 text-muted-foreground hover:bg-muted hover:border-border"
              }`}
            >
              <span className="text-sm leading-none">{group.emoji}</span>
              <span className="font-mono tabular-nums">{group.count}</span>
            </motion.button>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
