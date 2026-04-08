// mixins/search-pin-edit-api.mo
// Public API surface for message search, pinned messages, message editing,
// and shared-conversation queries.
// All existing chat/media/reactions endpoints are unchanged.

import List "mo:core/List";
import Map "mo:core/Map";
import Time "mo:core/Time";
import ChatTypes "../types/chat";
import Types "../types/search-pin-edit";
import SPELib "../lib/search-pin-edit";

mixin (
  messages : List.List<ChatTypes.MessageInternal>,
  conversations : List.List<ChatTypes.ConversationInternal>,
  pins : List.List<Types.PinEntry>,
  editHistories : Map.Map<Types.MessageId, Types.EditHistory>,
) {

  // ── Search ─────────────────────────────────────────────────────────────────

  /// Search messages across all conversations the caller belongs to.
  /// Returns matching messages with conversation context, sorted newest-first.
  public shared query ({ caller }) func searchMessages(keyword : Text) : async [Types.SearchResult] {
    SPELib.searchMessages(messages, conversations, caller, keyword);
  };

  // ── Pinned Messages ────────────────────────────────────────────────────────

  /// Pin a message in a conversation. Caller must be a member.
  public shared ({ caller }) func pinMessage(messageId : Types.MessageId) : async () {
    let now = Time.now();
    SPELib.pinMessage(messages, conversations, pins, messageId, caller, now);
  };

  /// Unpin a message. Caller must be a member.
  public shared ({ caller }) func unpinMessage(messageId : Types.MessageId) : async () {
    SPELib.unpinMessage(messages, conversations, pins, messageId, caller);
  };

  /// Get all pinned messages for a conversation. Caller must be a member.
  public shared query ({ caller }) func getPinnedMessages(conversationId : Types.ConversationId) : async [Types.PinnedMessage] {
    SPELib.getPinnedMessages(messages, conversations, pins, conversationId, caller);
  };

  // ── Message Editing ────────────────────────────────────────────────────────

  /// Edit a text or link message. Only the original sender may edit.
  /// Traps if the message is deleted or is not a text/link message.
  public shared ({ caller }) func editMessage(messageId : Types.MessageId, newContent : ChatTypes.MessageContent) : async () {
    let now = Time.now();
    SPELib.editMessage(messages, editHistories, messageId, newContent, caller, now);
  };

  /// Return the edit history for a message (oldest edits first).
  public query func getEditHistory(messageId : Types.MessageId) : async [Types.EditEntry] {
    SPELib.getEditHistory(editHistories, messageId);
  };

  // ── Shared Conversations ───────────────────────────────────────────────────

  /// Return conversations shared between the caller and the given user.
  public shared query ({ caller }) func getSharedConversations(targetUserId : Types.UserId) : async [ChatTypes.ConversationSummary] {
    SPELib.getSharedConversations(conversations, caller, targetUserId);
  };
};
