import Common "common";

module {
  public type UserId = Common.UserId;
  public type ConversationId = Common.ConversationId;
  public type MessageId = Common.MessageId;
  public type Timestamp = Common.Timestamp;

  // ── Reactions ──────────────────────────────────────────────────────────────

  /// One emoji reaction entry stored per (messageId, userId) pair.
  public type ReactionEntry = {
    messageId : MessageId;
    userId : UserId;
    emoji : Text;
  };

  /// Aggregated reaction group for a single emoji on a message.
  public type ReactionGroup = {
    emoji : Text;
    count : Nat;
    userIds : [UserId];
  };

  // ── Typing indicators ──────────────────────────────────────────────────────

  /// Records that a user is currently typing in a conversation.
  public type TypingEntry = {
    conversationId : ConversationId;
    userId : UserId;
    updatedAt : Timestamp;
  };

  // Typing timeout in nanoseconds: 5 seconds
  public let typingTimeoutNs : Int = 5_000_000_000;
};
