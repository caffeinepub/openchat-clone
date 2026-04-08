import List "mo:core/List";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Types "../types/chat";

module {
  // ── Key comparison for (UserId, ConversationId) tuples ───────────────────
  func compareReceiptKey(
    a : (Types.UserId, Types.ConversationId),
    b : (Types.UserId, Types.ConversationId),
  ) : Order.Order {
    let cmp = Principal.compare(a.0, b.0);
    if (cmp != #equal) return cmp;
    Nat.compare(a.1, b.1);
  };

  // ── User helpers ──────────────────────────────────────────────────────────

  /// Get existing profile or create a new one on first sign-in.
  public func getOrCreateProfile(
    profiles : Map.Map<Types.UserId, Types.UserProfile>,
    caller : Types.UserId,
    displayName : Text,
    now : Types.Timestamp,
  ) : Types.UserProfile {
    switch (profiles.get(caller)) {
      case (?existing) existing;
      case null {
        let profile : Types.UserProfile = {
          id = caller;
          displayName = displayName;
          registeredAt = now;
          profileImageUrl = null;
          bio = null;
          usernameHandle = null;
          lastHandleChange = null;
        };
        profiles.add(caller, profile);
        profile;
      };
    };
  };

  /// Return a profile by principal, or null if not registered.
  public func getProfile(
    profiles : Map.Map<Types.UserId, Types.UserProfile>,
    userId : Types.UserId,
  ) : ?Types.UserProfile {
    profiles.get(userId);
  };

  /// Update the caller's own profile. Returns the updated profile or an error Text.
  /// - profileImageUrl set to "" clears the image.
  /// - usernameHandle changes are subject to a 7-day cooldown.
  public func updateProfile(
    profiles : Map.Map<Types.UserId, Types.UserProfile>,
    caller : Types.UserId,
    req : Types.UpdateProfileRequest,
    now : Types.Timestamp,
  ) : Types.UpdateProfileResult {
    let existing = switch (profiles.get(caller)) {
      case null return #err("Profile not found. Call getOrCreateProfile first.");
      case (?p) p;
    };

    // Handle username handle cooldown (7 days = 604_800_000_000_000 nanoseconds)
    let handleCooldownNs : Int = 604_800_000_000_000;
    let newHandle : ?Text = switch (req.usernameHandle) {
      case null existing.usernameHandle; // unchanged
      case (?h) {
        // Check cooldown
        switch (existing.lastHandleChange) {
          case (?lastChange) {
            if (now - lastChange < handleCooldownNs) {
              return #err("Username handle can only be changed once every 7 days.");
            };
          };
          case null {};
        };
        ?h;
      };
    };
    let handleChanged = switch (req.usernameHandle) {
      case null false;
      case (?_) true;
    };

    let newImageUrl : ?Text = switch (req.profileImageUrl) {
      case null existing.profileImageUrl; // unchanged
      case (?url) {
        if (url == "") null  // empty string clears the image
        else ?url;
      };
    };

    let updated : Types.UserProfile = {
      id               = existing.id;
      displayName      = switch (req.displayName) { case null existing.displayName; case (?n) n };
      registeredAt     = existing.registeredAt;
      profileImageUrl  = newImageUrl;
      bio              = switch (req.bio) { case null existing.bio; case (?b) ?b };
      usernameHandle   = newHandle;
      lastHandleChange = if (handleChanged) ?now else existing.lastHandleChange;
    };
    profiles.add(caller, updated);
    #ok updated;
  };

  // ── Conversation helpers ──────────────────────────────────────────────────

  /// Create a new direct message conversation between two principals.
  /// Returns the existing conversation if one already exists.
  public func createDirectConversation(
    conversations : List.List<Types.ConversationInternal>,
    nextId : Nat,
    callerUserId : Types.UserId,
    otherUserId : Types.UserId,
    _now : Types.Timestamp,
  ) : (Types.ConversationInternal, Nat) {
    // Check for existing direct conversation between the two users
    let existing = conversations.find(func(c : Types.ConversationInternal) : Bool {
      switch (c.kind) {
        case (#direct) {
          let members = c.members;
          let hasCallerUser = members.find(func(m : Types.UserId) : Bool {
            Principal.equal(m, callerUserId)
          });
          let hasOtherUser = members.find(func(m : Types.UserId) : Bool {
            Principal.equal(m, otherUserId)
          });
          switch (hasCallerUser, hasOtherUser) {
            case (?_, ?_) true;
            case _ false;
          };
        };
        case (#group _) false;
      };
    });
    switch (existing) {
      case (?conv) (conv, nextId);
      case null {
        let conv : Types.ConversationInternal = {
          id = nextId;
          kind = #direct;
          var members = [callerUserId, otherUserId];
          var lastMessageId = null;
          var lastMessageAt = null;
        };
        conversations.add(conv);
        (conv, nextId + 1);
      };
    };
  };

  /// Create a new group conversation.
  public func createGroupConversation(
    conversations : List.List<Types.ConversationInternal>,
    nextId : Nat,
    name : Text,
    members : [Types.UserId],
    _now : Types.Timestamp,
  ) : (Types.ConversationInternal, Nat) {
    let conv : Types.ConversationInternal = {
      id = nextId;
      kind = #group { name = name };
      var members = members;
      var lastMessageId = null;
      var lastMessageAt = null;
    };
    conversations.add(conv);
    (conv, nextId + 1);
  };

  /// Return all conversations that the given user is a member of,
  /// annotated with per-user unread counts.
  public func listConversationsForUser(
    conversations : List.List<Types.ConversationInternal>,
    readReceipts : Map.Map<(Types.UserId, Types.ConversationId), Types.ReadReceipt>,
    messages : List.List<Types.MessageInternal>,
    userId : Types.UserId,
  ) : [Types.ConversationSummary] {
    let filtered = conversations.filter(func(c : Types.ConversationInternal) : Bool {
      c.members.find(func(m : Types.UserId) : Bool { Principal.equal(m, userId) }) != null
    });
    filtered.map<Types.ConversationInternal, Types.ConversationSummary>(func(c) {
      {
        id = c.id;
        kind = c.kind;
        members = c.members;
        lastMessageAt = c.lastMessageAt;
        unreadCount = unreadCount(messages, readReceipts, userId, c.id);
      }
    }).toArray();
  };

  /// Return details for a single conversation, or null if not found / caller not a member.
  public func getConversation(
    conversations : List.List<Types.ConversationInternal>,
    conversationId : Types.ConversationId,
    callerId : Types.UserId,
  ) : ?Types.ConversationSummary {
    switch (conversations.find(func(c : Types.ConversationInternal) : Bool { c.id == conversationId })) {
      case null null;
      case (?conv) {
        let isMember = conv.members.find(func(m : Types.UserId) : Bool { Principal.equal(m, callerId) });
        switch (isMember) {
          case null null;
          case (?_) {
            ?{
              id = conv.id;
              kind = conv.kind;
              members = conv.members;
              lastMessageAt = conv.lastMessageAt;
              unreadCount = 0;
            }
          };
        };
      };
    };
  };

  // ── Message helpers ───────────────────────────────────────────────────────

  /// Append a new text message to a conversation.
  /// Returns the created message and updated nextMessageId.
  public func sendMessage(
    conversations : List.List<Types.ConversationInternal>,
    messages : List.List<Types.MessageInternal>,
    nextId : Nat,
    conversationId : Types.ConversationId,
    sender : Types.UserId,
    text : Text,
    now : Types.Timestamp,
  ) : (Types.MessageInternal, Nat) {
    // Verify sender is a member
    let conv = switch (conversations.find(func(c : Types.ConversationInternal) : Bool { c.id == conversationId })) {
      case null Runtime.trap("Conversation not found");
      case (?c) c;
    };
    let isMember = conv.members.find(func(m : Types.UserId) : Bool { Principal.equal(m, sender) });
    switch (isMember) {
      case null Runtime.trap("Caller is not a member of this conversation");
      case (?_) {};
    };
    let msg : Types.MessageInternal = {
      id = nextId;
      conversationId = conversationId;
      sender = sender;
      content = #text(text);
      sentAt = now;
      editedAt = null;
    };
    messages.add(msg);
    // Update conversation last message info
    conv.lastMessageId := ?nextId;
    conv.lastMessageAt := ?now;
    (msg, nextId + 1);
  };

  /// Return a page of messages for a conversation (newest-first).
  /// `beforeId` is the exclusive upper bound cursor; null means start from the latest.
  public func getMessages(
    messages : List.List<Types.MessageInternal>,
    conversationId : Types.ConversationId,
    callerId : Types.UserId,
    conversations : List.List<Types.ConversationInternal>,
    beforeId : ?Types.MessageId,
    limit : Nat,
  ) : Types.MessagePage {
    // Verify caller is a member
    let conv = switch (conversations.find(func(c : Types.ConversationInternal) : Bool { c.id == conversationId })) {
      case null Runtime.trap("Conversation not found");
      case (?c) c;
    };
    let isMember = conv.members.find(func(m : Types.UserId) : Bool { Principal.equal(m, callerId) });
    switch (isMember) {
      case null Runtime.trap("Caller is not a member of this conversation");
      case (?_) {};
    };

    // Filter messages for this conversation, apply cursor, collect newest-first
    let allForConv = messages.filter(func(m : Types.MessageInternal) : Bool {
      m.conversationId == conversationId
    });

    // Apply beforeId filter
    let beforeFiltered = switch (beforeId) {
      case null allForConv;
      case (?bid) allForConv.filter(func(m : Types.MessageInternal) : Bool { m.id < bid });
    };

    // Reverse to get newest-first, then take `limit` messages
    let arr = beforeFiltered.toArray();
    let reversed = arr.reverse();
    let taken = reversed.sliceToArray(0, limit);
    // If there are more messages beyond what we took, expose the oldest taken message id as cursor
    let nextCursor : ?Types.MessageId = if (reversed.size() > limit and taken.size() > 0) {
      let lastIdx = taken.size() - 1 : Nat;
      ?taken[lastIdx].id
    } else {
      null
    };
    {
      messages = taken;
      nextCursor = nextCursor;
    };
  };

  /// Soft-delete a message (replace content with #deleted). Only the sender may delete.
  public func deleteMessage(
    messages : List.List<Types.MessageInternal>,
    messageId : Types.MessageId,
    callerId : Types.UserId,
  ) : Bool {
    var found = false;
    messages.mapInPlace(func(m : Types.MessageInternal) : Types.MessageInternal {
      if (m.id == messageId and Principal.equal(m.sender, callerId)) {
        found := true;
        { m with content = #deleted };
      } else {
        m;
      };
    });
    found;
  };

  /// Mark a conversation as read for the given user (reset unread count).
  public func markAsRead(
    readReceipts : Map.Map<(Types.UserId, Types.ConversationId), Types.ReadReceipt>,
    messages : List.List<Types.MessageInternal>,
    userId : Types.UserId,
    conversationId : Types.ConversationId,
  ) {
    // Find the latest message id in this conversation
    let lastMsg = messages.filter(func(m : Types.MessageInternal) : Bool {
      m.conversationId == conversationId
    }).last();
    let lastId : ?Types.MessageId = switch (lastMsg) {
      case null null;
      case (?m) ?m.id;
    };
    let key = (userId, conversationId);
    switch (readReceipts.get(compareReceiptKey, key)) {
      case (?receipt) {
        receipt.lastReadMessageId := lastId;
      };
      case null {
        let receipt : Types.ReadReceipt = {
          userId = userId;
          conversationId = conversationId;
          var lastReadMessageId = lastId;
        };
        readReceipts.add(compareReceiptKey, key, receipt);
      };
    };
  };

  // ── Unread count helper ───────────────────────────────────────────────────

  /// Count messages in a conversation that are newer than the user's last-read message.
  public func unreadCount(
    messages : List.List<Types.MessageInternal>,
    readReceipts : Map.Map<(Types.UserId, Types.ConversationId), Types.ReadReceipt>,
    userId : Types.UserId,
    conversationId : Types.ConversationId,
  ) : Nat {
    let lastReadId : ?Types.MessageId = switch (readReceipts.get(compareReceiptKey, (userId, conversationId))) {
      case null null;
      case (?r) r.lastReadMessageId;
    };
    messages.filter(func(m : Types.MessageInternal) : Bool {
      if (m.conversationId != conversationId) return false;
      switch (lastReadId) {
        case null true; // no read receipt → all messages are unread
        case (?lid) m.id > lid;
      };
    }).size();
  };
};
