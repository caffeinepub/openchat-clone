import Common "common";
import MediaTypes "chat-media";

module {
  public type UserId = Common.UserId;
  public type ConversationId = Common.ConversationId;
  public type MessageId = Common.MessageId;
  public type Timestamp = Common.Timestamp;

  // User profile
  public type UserProfile = {
    id : UserId;
    displayName : Text;
    registeredAt : Timestamp;
    profileImageUrl : ?Text;
    bio : ?Text;
    usernameHandle : ?Text;
    lastHandleChange : ?Int;
  };

  // Request type for updating a user's own profile fields.
  // All fields are optional — only provided fields are applied.
  public type UpdateProfileRequest = {
    displayName : ?Text;
    profileImageUrl : ?Text; // empty string "" clears the image (falls back to initials)
    bio : ?Text;
    usernameHandle : ?Text;
  };

  // Result for profile update — avoids deprecated Result type.
  public type UpdateProfileResult = { #ok : UserProfile; #err : Text };

  // Conversation kind
  public type ConversationKind = {
    #direct;
    #group : { name : Text };
  };

  // Internal conversation state (not shared directly)
  public type ConversationInternal = {
    id : ConversationId;
    kind : ConversationKind;
    var members : [UserId];
    var lastMessageId : ?MessageId;
    var lastMessageAt : ?Timestamp;
  };

  // Shared conversation summary returned to callers
  public type ConversationSummary = {
    id : ConversationId;
    kind : ConversationKind;
    members : [UserId];
    lastMessageAt : ?Timestamp;
    unreadCount : Nat;
  };

  // Message content — re-exported from chat-media for unified storage.
  // Includes #text, #deleted, #image, #video, #audio, #link variants.
  public type MessageContent = MediaTypes.MessageContent;

  // Internal message
  public type MessageInternal = {
    id : MessageId;
    conversationId : ConversationId;
    sender : UserId;
    content : MessageContent;
    sentAt : Timestamp;
    editedAt : ?Timestamp;
  };

  // Shared message returned to callers
  public type Message = {
    id : MessageId;
    conversationId : ConversationId;
    sender : UserId;
    content : MessageContent;
    sentAt : Timestamp;
  };

  // Per-user read tracking per conversation
  public type ReadReceipt = {
    userId : UserId;
    conversationId : ConversationId;
    var lastReadMessageId : ?MessageId;
  };

  // Pagination cursor for messages
  public type MessagePage = {
    messages : [Message];
    nextCursor : ?MessageId;
  };
};
