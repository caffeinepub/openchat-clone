import Principal "mo:core/Principal";
import MediaTypes "chat-media";

module {
  public type RoomId = Nat;
  public type MessageId = Nat;
  public type UserId = Principal;
  public type Timestamp = Int;

  // Re-export MessageContent for unified media handling across all room types
  public type MessageContent = MediaTypes.MessageContent;

  // Internal room representation — var fields for mutable state
  public type CatalogRoomInternal = {
    id : RoomId;
    title : Text;
    description : Text;
    coverImageUrl : ?Text;
    creator : UserId;
    createdAt : Timestamp;
    var lastActivityAt : Timestamp;
    var members : [UserId];
    var messageCount : Nat;
  };

  // Public / shared room representation (no var fields)
  public type CatalogRoom = {
    id : RoomId;
    title : Text;
    description : Text;
    coverImageUrl : ?Text;
    creator : UserId;
    createdAt : Timestamp;
    lastActivityAt : Timestamp;
    members : [UserId];
    messageCount : Nat;
  };

  // Upgraded catalog message — uses MessageContent variant like group chats
  public type CatalogMessageInternal = {
    id : MessageId;
    roomId : RoomId;
    author : UserId;
    content : MessageContent;
    createdAt : Timestamp;
    var editedAt : ?Timestamp;
    var deleted : Bool;
    var reactions : [(Text, [UserId])];   // emoji -> list of reactors
    var pinned : Bool;
  };

  // Public / shared message representation (no var fields)
  public type CatalogMessage = {
    id : MessageId;
    roomId : RoomId;
    author : UserId;
    content : MessageContent;
    createdAt : Timestamp;
    editedAt : ?Timestamp;
    deleted : Bool;
    reactions : [(Text, [UserId])];
    pinned : Bool;
  };

  // Input for sending a media message to a catalog room
  public type SendCatalogMediaInput = {
    roomId : RoomId;
    content : MessageContent;
  };

  // Typing indicator entry for catalog rooms
  public type CatalogTypingEntry = {
    roomId : RoomId;
    userId : UserId;
    var lastTypingAt : Timestamp;
  };

  // Report for flagging rooms or messages
  public type ReportTargetKind = { #room; #message };

  public type CatalogReport = {
    id : Nat;
    targetKind : ReportTargetKind;
    targetId : Nat;
    reporterId : UserId;
    reason : Text;
    createdAt : Timestamp;
  };
};
