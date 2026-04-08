// types/search-pin-edit.mo
// Domain types for message search, pinned messages, message editing, and user profile queries.

import Common "common";
import ChatTypes "chat";

module {
  public type UserId = Common.UserId;
  public type ConversationId = Common.ConversationId;
  public type MessageId = Common.MessageId;
  public type Timestamp = Common.Timestamp;

  // ── Message Search ─────────────────────────────────────────────────────────

  /// A single search result entry — one matching message with context.
  public type SearchResult = {
    messageId : MessageId;
    conversationId : ConversationId;
    sender : UserId;
    snippet : Text;      // content summary (text/link title/etc.)
    sentAt : Timestamp;
  };

  // ── Pinned Messages ────────────────────────────────────────────────────────

  /// A pin record — tracks which message is pinned in a conversation and by whom.
  public type PinEntry = {
    messageId : MessageId;
    conversationId : ConversationId;
    pinnedBy : UserId;
    pinnedAt : Timestamp;
  };

  /// Shared view of a pinned message returned to callers.
  public type PinnedMessage = {
    messageId : MessageId;
    conversationId : ConversationId;
    pinnedBy : UserId;
    pinnedAt : Timestamp;
    message : ChatTypes.Message;
  };

  // ── Message Editing ────────────────────────────────────────────────────────

  /// One edit history entry — stores what the message looked like before the edit.
  public type EditEntry = {
    editedAt : Timestamp;
    previousContent : ChatTypes.MessageContent;
  };

  /// Mutable edit state per message — stores the list of past edits.
  public type EditHistory = {
    messageId : MessageId;
    var edits : [EditEntry];   // ordered oldest first
  };
};
