import List "mo:core/List";
import Map "mo:core/Map";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Types "../types/chat";
import ChatLib "../lib/chat";

mixin (
  profiles : Map.Map<Types.UserId, Types.UserProfile>,
  conversations : List.List<Types.ConversationInternal>,
  messages : List.List<Types.MessageInternal>,
  readReceipts : Map.Map<(Types.UserId, Types.ConversationId), Types.ReadReceipt>,
  nextConversationId : List.List<Nat>,
  nextMessageId : List.List<Nat>,
) {

  // ── Users ─────────────────────────────────────────────────────────────────

  /// Get the caller's profile, creating it with the given display name on first sign-in.
  public shared ({ caller }) func getOrCreateProfile(displayName : Text) : async Types.UserProfile {
    let now = Time.now();
    ChatLib.getOrCreateProfile(profiles, caller, displayName, now);
  };

  /// Return any user's public profile.
  public query func getProfile(userId : Types.UserId) : async ?Types.UserProfile {
    ChatLib.getProfile(profiles, userId);
  };

  /// Update the caller's own profile fields.
  /// Returns the updated profile or an error message (e.g. handle cooldown).
  public shared ({ caller }) func updateProfile(req : Types.UpdateProfileRequest) : async Types.UpdateProfileResult {
    let now = Time.now();
    ChatLib.updateProfile(profiles, caller, req, now);
  };

  // ── Conversations ─────────────────────────────────────────────────────────

  /// Start or return an existing direct-message conversation with another user.
  public shared ({ caller }) func createDirectConversation(otherUserId : Types.UserId) : async Types.ConversationSummary {
    let now = Time.now();
    let (conv, newId) = ChatLib.createDirectConversation(
      conversations,
      nextConversationId.at(0),
      caller,
      otherUserId,
      now,
    );
    nextConversationId.put(0, newId);
    {
      id = conv.id;
      kind = conv.kind;
      members = conv.members;
      lastMessageAt = conv.lastMessageAt;
      unreadCount = 0;
    };
  };

  /// Create a new group chat.
  public shared ({ caller }) func createGroupConversation(name : Text, memberIds : [Types.UserId]) : async Types.ConversationSummary {
    let now = Time.now();
    // Ensure caller is in the member list
    let allMembers : [Types.UserId] = switch (memberIds.find(func(m : Types.UserId) : Bool {
      Principal.equal(m, caller)
    })) {
      case (?_) memberIds;
      case null memberIds.concat([caller]);
    };
    let (conv, newId) = ChatLib.createGroupConversation(
      conversations,
      nextConversationId.at(0),
      name,
      allMembers,
      now,
    );
    nextConversationId.put(0, newId);
    {
      id = conv.id;
      kind = conv.kind;
      members = conv.members;
      lastMessageAt = conv.lastMessageAt;
      unreadCount = 0;
    };
  };

  /// List all conversations the caller belongs to with unread counts.
  public shared query ({ caller }) func listConversations() : async [Types.ConversationSummary] {
    ChatLib.listConversationsForUser(conversations, readReceipts, messages, caller);
  };

  /// Get details for a single conversation (caller must be a member).
  public shared query ({ caller }) func getConversation(conversationId : Types.ConversationId) : async ?Types.ConversationSummary {
    ChatLib.getConversation(conversations, conversationId, caller);
  };

  // ── Messaging ─────────────────────────────────────────────────────────────

  /// Send a text message to a conversation (caller must be a member).
  public shared ({ caller }) func sendMessage(conversationId : Types.ConversationId, text : Text) : async Types.Message {
    let now = Time.now();
    let (msg, newId) = ChatLib.sendMessage(
      conversations,
      messages,
      nextMessageId.at(0),
      conversationId,
      caller,
      text,
      now,
    );
    nextMessageId.put(0, newId);
    {
      id = msg.id;
      conversationId = msg.conversationId;
      sender = msg.sender;
      content = msg.content;
      sentAt = msg.sentAt;
    };
  };

  /// Retrieve a page of messages, newest first.
  /// Pass null for `beforeId` to get the latest page.
  public shared query ({ caller }) func getMessages(conversationId : Types.ConversationId, beforeId : ?Types.MessageId, limit : Nat) : async Types.MessagePage {
    ChatLib.getMessages(messages, conversationId, caller, conversations, beforeId, limit);
  };

  /// Soft-delete the caller's own message.
  public shared ({ caller }) func deleteMessage(messageId : Types.MessageId) : async Bool {
    ChatLib.deleteMessage(messages, messageId, caller);
  };

  /// Mark a conversation as fully read (resets unread count to 0).
  public shared ({ caller }) func markConversationRead(conversationId : Types.ConversationId) : async () {
    ChatLib.markAsRead(readReceipts, messages, caller, conversationId);
  };
};
