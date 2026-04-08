import List "mo:core/List";
import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Types "../types/reactions-and-typing";
import ChatTypes "../types/chat";

module {
  // ── Key helpers ────────────────────────────────────────────────────────────

  func compareReactionKey(
    a : (Types.MessageId, Types.UserId),
    b : (Types.MessageId, Types.UserId),
  ) : Order.Order {
    let cmp = Nat.compare(a.0, b.0);
    if (cmp != #equal) return cmp;
    Principal.compare(a.1, b.1);
  };

  func compareTypingKey(
    a : (Types.ConversationId, Types.UserId),
    b : (Types.ConversationId, Types.UserId),
  ) : Order.Order {
    let cmp = Nat.compare(a.0, b.0);
    if (cmp != #equal) return cmp;
    Principal.compare(a.1, b.1);
  };

  // ── Reactions ──────────────────────────────────────────────────────────────

  /// Add or replace a reaction from `userId` on `messageId`.
  /// Key is (messageId, userId) — one reaction per user per message.
  public func addReaction(
    reactions : Map.Map<(Types.MessageId, Types.UserId), Types.ReactionEntry>,
    messageId : Types.MessageId,
    userId : Types.UserId,
    emoji : Text,
    _now : Types.Timestamp,
  ) {
    let entry : Types.ReactionEntry = {
      messageId = messageId;
      userId = userId;
      emoji = emoji;
    };
    reactions.add(compareReactionKey, (messageId, userId), entry);
  };

  /// Remove the caller's reaction from a message.
  public func removeReaction(
    reactions : Map.Map<(Types.MessageId, Types.UserId), Types.ReactionEntry>,
    messageId : Types.MessageId,
    userId : Types.UserId,
  ) {
    reactions.remove(compareReactionKey, (messageId, userId));
  };

  /// Return all reactions for a message grouped by emoji with counts.
  public func getReactions(
    reactions : Map.Map<(Types.MessageId, Types.UserId), Types.ReactionEntry>,
    messageId : Types.MessageId,
  ) : [Types.ReactionGroup] {
    // Collect all entries for this message into a List
    let entries = List.empty<Types.ReactionEntry>();
    reactions.forEach(func(key : (Types.MessageId, Types.UserId), entry : Types.ReactionEntry) {
      if (key.0 == messageId) {
        entries.add(entry);
      };
    });

    // Build a map from emoji -> List of userIds
    let emojiMap = Map.empty<Text, List.List<Types.UserId>>();
    entries.forEach(func(entry : Types.ReactionEntry) {
      switch (emojiMap.get(entry.emoji)) {
        case (?existing) {
          existing.add(entry.userId);
        };
        case null {
          let userList = List.singleton(entry.userId);
          emojiMap.add(entry.emoji, userList);
        };
      };
    });

    // Convert to array of ReactionGroup
    let groups = List.empty<Types.ReactionGroup>();
    emojiMap.forEach(func(emoji : Text, userList : List.List<Types.UserId>) {
      groups.add({
        emoji = emoji;
        count = userList.size();
        userIds = userList.toArray();
      });
    });
    groups.toArray();
  };

  // ── Typing indicators ──────────────────────────────────────────────────────

  /// Set or clear the caller's typing status in a conversation.
  /// When `isTyping` is false, the entry is removed.
  public func setTyping(
    typing : Map.Map<(Types.ConversationId, Types.UserId), Types.TypingEntry>,
    conversationId : Types.ConversationId,
    userId : Types.UserId,
    isTyping : Bool,
    now : Types.Timestamp,
  ) {
    let key = (conversationId, userId);
    if (isTyping) {
      let entry : Types.TypingEntry = {
        conversationId = conversationId;
        userId = userId;
        updatedAt = now;
      };
      typing.add(compareTypingKey, key, entry);
    } else {
      typing.remove(compareTypingKey, key);
    };
  };

  /// Return profiles of users currently typing in a conversation.
  /// Entries older than `typingTimeoutNs` are considered stale and excluded.
  public func getTypingUsers(
    typing : Map.Map<(Types.ConversationId, Types.UserId), Types.TypingEntry>,
    profiles : Map.Map<Types.UserId, ChatTypes.UserProfile>,
    conversationId : Types.ConversationId,
    now : Types.Timestamp,
  ) : [ChatTypes.UserProfile] {
    let cutoff : Types.Timestamp = now - Types.typingTimeoutNs;
    let result = List.empty<ChatTypes.UserProfile>();
    typing.forEach(func(key : (Types.ConversationId, Types.UserId), entry : Types.TypingEntry) {
      if (key.0 == conversationId and entry.updatedAt >= cutoff) {
        switch (profiles.get(entry.userId)) {
          case (?profile) { result.add(profile) };
          case null {};
        };
      };
    });
    result.toArray();
  };
};
