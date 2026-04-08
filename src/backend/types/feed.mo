import Principal "mo:core/Principal";
import MediaTypes "chat-media";

module {
  public type PostId = Nat;
  public type UserId = Principal;
  public type Timestamp = Int;

  // Re-export MessageContent for unified media handling across all room types
  public type MessageContent = MediaTypes.MessageContent;

  // Internal representation — var fields for mutable state
  public type PostInternal = {
    id : PostId;
    author : UserId;
    content : MessageContent;
    timestamp : Timestamp;
    var likedBy : [UserId];
    parentPostId : ?PostId;
    var reactions : [(Text, [UserId])];  // emoji -> list of reactors
    var pinned : Bool;
  };

  // Shared / public representation (no var fields)
  public type Post = {
    id : PostId;
    author : UserId;
    content : MessageContent;
    timestamp : Timestamp;
    likedBy : [UserId];
    parentPostId : ?PostId;
    reactions : [(Text, [UserId])];
    pinned : Bool;
  };

  // Input for sending a media post or reply
  public type SendFeedMediaInput = {
    content : MessageContent;
    parentPostId : ?PostId;
  };

  // Typing entry for feed post chatrooms (keyed by postId)
  public type FeedTypingEntry = {
    postId : PostId;
    userId : UserId;
    var lastTypingAt : Timestamp;
  };

  public type FeedPage = {
    posts : [Post];
    total : Nat;
  };
};
