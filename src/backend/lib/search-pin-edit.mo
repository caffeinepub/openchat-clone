// lib/search-pin-edit.mo
// Domain logic for message search, pinned messages, message editing,
// and shared-conversation queries.

import List "mo:core/List";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Int "mo:core/Int";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import ChatTypes "../types/chat";
import Types "../types/search-pin-edit";

module {

  // ── Helpers ────────────────────────────────────────────────────────────────

  /// Extract the searchable text from a message (text and link title/url only).
  func snippetOf(content : ChatTypes.MessageContent) : ?Text {
    switch (content) {
      case (#text t) ?t;
      case (#link l) {
        let base = switch (l.title) { case (?t) t; case null l.url };
        ?base;
      };
      case (#deleted) null;
      case (#image _) null;
      case (#video _) null;
      case (#audio _) null;
    };
  };

  /// Truncate text to at most 100 characters.
  func truncate(t : Text) : Text {
    if (t.size() <= 100) t
    else Text.fromIter(t.toIter().take(100));
  };

  /// Check whether `haystack` contains `needle` (case-insensitive).
  func containsIgnoreCase(haystack : Text, needle : Text) : Bool {
    haystack.toLower().contains(#text (needle.toLower()));
  };

  /// Return true if `userId` is a member of `conv`.
  func isMember(conv : ChatTypes.ConversationInternal, userId : Types.UserId) : Bool {
    conv.members.find(func(m : Types.UserId) : Bool { Principal.equal(m, userId) }) != null;
  };

  // ── Message Search ─────────────────────────────────────────────────────────

  /// Search all conversations visible to `callerId` for messages whose text
  /// content contains `keyword` (case-insensitive).
  /// Returns matching SearchResult entries sorted newest-first.
  public func searchMessages(
    messages : List.List<ChatTypes.MessageInternal>,
    conversations : List.List<ChatTypes.ConversationInternal>,
    callerId : Types.UserId,
    keyword : Text,
  ) : [Types.SearchResult] {
    // Collect IDs of conversations the caller is a member of.
    let memberConvIds : List.List<Types.ConversationId> = conversations
      .filter(func(c : ChatTypes.ConversationInternal) : Bool { isMember(c, callerId) })
      .map<ChatTypes.ConversationInternal, Types.ConversationId>(func(c) { c.id });

    // Filter messages: must be in a member conversation, not deleted, and match keyword.
    let results = messages.filterMap<ChatTypes.MessageInternal, Types.SearchResult>(
      func(m) {
        // Must be in a conversation the caller can see
        let inConv = memberConvIds.find(func(id : Types.ConversationId) : Bool { id == m.conversationId }) != null;
        if (not inConv) return null;
        // Get searchable text (skips deleted/image/video/audio)
        switch (snippetOf(m.content)) {
          case null null;
          case (?raw) {
            if (not containsIgnoreCase(raw, keyword)) return null;
            ?{
              messageId      = m.id;
              conversationId = m.conversationId;
              sender         = m.sender;
              snippet        = truncate(raw);
              sentAt         = m.sentAt;
            };
          };
        };
      }
    );

    // Sort newest-first and return as array
    let arr = results.toArray();
    arr.sort(func(a : Types.SearchResult, b : Types.SearchResult) : { #less; #equal; #greater } {
      Int.compare(b.sentAt, a.sentAt);
    });
  };

  // ── Pinned Messages ────────────────────────────────────────────────────────

  /// Pin a message in its conversation. Only conversation members may pin.
  /// Upserts the pin entry (updates pinnedBy/pinnedAt if already pinned).
  public func pinMessage(
    messages : List.List<ChatTypes.MessageInternal>,
    conversations : List.List<ChatTypes.ConversationInternal>,
    pins : List.List<Types.PinEntry>,
    messageId : Types.MessageId,
    callerId : Types.UserId,
    now : Types.Timestamp,
  ) {
    // Resolve message to get its conversationId
    let msg = switch (messages.find(func(m : ChatTypes.MessageInternal) : Bool { m.id == messageId })) {
      case null Runtime.trap("Message not found");
      case (?m) m;
    };
    // Verify caller is a member
    let conv = switch (conversations.find(func(c : ChatTypes.ConversationInternal) : Bool { c.id == msg.conversationId })) {
      case null Runtime.trap("Conversation not found");
      case (?c) c;
    };
    if (not isMember(conv, callerId)) Runtime.trap("Caller is not a member of this conversation");

    // Upsert: update existing pin or add new one
    var found = false;
    pins.mapInPlace(func(p : Types.PinEntry) : Types.PinEntry {
      if (p.messageId == messageId and p.conversationId == msg.conversationId) {
        found := true;
        { p with pinnedBy = callerId; pinnedAt = now };
      } else {
        p;
      };
    });
    if (not found) {
      pins.add({
        messageId      = messageId;
        conversationId = msg.conversationId;
        pinnedBy       = callerId;
        pinnedAt       = now;
      });
    };
  };

  /// Unpin a message. Only conversation members may unpin.
  public func unpinMessage(
    messages : List.List<ChatTypes.MessageInternal>,
    conversations : List.List<ChatTypes.ConversationInternal>,
    pins : List.List<Types.PinEntry>,
    messageId : Types.MessageId,
    callerId : Types.UserId,
  ) {
    // Resolve message to get its conversationId
    let msg = switch (messages.find(func(m : ChatTypes.MessageInternal) : Bool { m.id == messageId })) {
      case null Runtime.trap("Message not found");
      case (?m) m;
    };
    // Verify caller is a member
    let conv = switch (conversations.find(func(c : ChatTypes.ConversationInternal) : Bool { c.id == msg.conversationId })) {
      case null Runtime.trap("Conversation not found");
      case (?c) c;
    };
    if (not isMember(conv, callerId)) Runtime.trap("Caller is not a member of this conversation");

    // Remove the pin entry for this (conversationId, messageId) pair
    let kept = pins.filter(func(p : Types.PinEntry) : Bool {
      not (p.messageId == messageId and p.conversationId == msg.conversationId)
    });
    pins.clear();
    pins.append(kept);
  };

  /// Return all pinned messages for a conversation. Caller must be a member.
  /// Sorted by pinnedAt newest-first.
  public func getPinnedMessages(
    messages : List.List<ChatTypes.MessageInternal>,
    conversations : List.List<ChatTypes.ConversationInternal>,
    pins : List.List<Types.PinEntry>,
    conversationId : Types.ConversationId,
    callerId : Types.UserId,
  ) : [Types.PinnedMessage] {
    let conv = switch (conversations.find(func(c : ChatTypes.ConversationInternal) : Bool { c.id == conversationId })) {
      case null Runtime.trap("Conversation not found");
      case (?c) c;
    };
    if (not isMember(conv, callerId)) Runtime.trap("Caller is not a member of this conversation");

    // Collect pins for this conversation
    let convPins = pins.filter(func(p : Types.PinEntry) : Bool { p.conversationId == conversationId });

    // Build PinnedMessage entries
    let pinned = convPins.filterMap<Types.PinEntry, Types.PinnedMessage>(func(p) {
      switch (messages.find(func(m : ChatTypes.MessageInternal) : Bool { m.id == p.messageId })) {
        case null null; // message may have been hard-deleted — skip
        case (?m) {
          ?{
            messageId      = p.messageId;
            conversationId = p.conversationId;
            pinnedBy       = p.pinnedBy;
            pinnedAt       = p.pinnedAt;
            message        = {
              id             = m.id;
              conversationId = m.conversationId;
              sender         = m.sender;
              content        = m.content;
              sentAt         = m.sentAt;
            };
          };
        };
      };
    });

    let arr = pinned.toArray();
    arr.sort(func(a : Types.PinnedMessage, b : Types.PinnedMessage) : { #less; #equal; #greater } {
      Int.compare(b.pinnedAt, a.pinnedAt);
    });
  };

  // ── Message Editing ────────────────────────────────────────────────────────

  /// Edit a text or link message. Only the original sender may edit.
  /// Stores the previous content in edit history.
  public func editMessage(
    messages : List.List<ChatTypes.MessageInternal>,
    editHistories : Map.Map<Types.MessageId, Types.EditHistory>,
    messageId : Types.MessageId,
    newContent : ChatTypes.MessageContent,
    callerId : Types.UserId,
    now : Types.Timestamp,
  ) {
    // Locate the message
    let msg = switch (messages.find(func(m : ChatTypes.MessageInternal) : Bool { m.id == messageId })) {
      case null Runtime.trap("Message not found");
      case (?m) m;
    };
    // Only the sender may edit
    if (not Principal.equal(msg.sender, callerId)) Runtime.trap("Only the sender can edit this message");
    // Cannot edit deleted messages
    switch (msg.content) {
      case (#deleted) Runtime.trap("Cannot edit a deleted message");
      case (#text _) {};  // allowed
      case (#link _) {};  // allowed
      case _ Runtime.trap("Only text and link messages can be edited");
    };

    // Store old content in edit history
    let editEntry : Types.EditEntry = { editedAt = now; previousContent = msg.content };
    switch (editHistories.get(messageId)) {
      case (?history) {
        history.edits := history.edits.concat([editEntry]);
      };
      case null {
        let history : Types.EditHistory = { messageId = messageId; var edits = [editEntry] };
        editHistories.add(messageId, history);
      };
    };

    // Update message content in-place
    messages.mapInPlace(func(m : ChatTypes.MessageInternal) : ChatTypes.MessageInternal {
      if (m.id == messageId) { { m with content = newContent; editedAt = ?now } } else { m };
    });
  };

  /// Return the edit history for a message (oldest edits first).
  /// Returns empty array if the message has never been edited.
  public func getEditHistory(
    editHistories : Map.Map<Types.MessageId, Types.EditHistory>,
    messageId : Types.MessageId,
  ) : [Types.EditEntry] {
    switch (editHistories.get(messageId)) {
      case null [];
      case (?history) history.edits;
    };
  };

  // ── User Profile / Shared Conversations ───────────────────────────────────

  /// Return conversations that both `callerId` and `targetUserId` are members of.
  public func getSharedConversations(
    conversations : List.List<ChatTypes.ConversationInternal>,
    callerId : Types.UserId,
    targetUserId : Types.UserId,
  ) : [ChatTypes.ConversationSummary] {
    conversations
      .filter(func(c : ChatTypes.ConversationInternal) : Bool {
        isMember(c, callerId) and isMember(c, targetUserId)
      })
      .map<ChatTypes.ConversationInternal, ChatTypes.ConversationSummary>(func(c) {
        {
          id            = c.id;
          kind          = c.kind;
          members       = c.members;
          lastMessageAt = c.lastMessageAt;
          unreadCount   = 0;
        };
      })
      .toArray();
  };
};
