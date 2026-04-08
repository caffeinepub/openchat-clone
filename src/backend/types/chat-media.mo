// types/chat-media.mo
// Media message content types extending the chat domain.
// These variants are additive — existing #text and #deleted variants are untouched.

module {

  /// Payload for an image message.
  public type ImageContent = {
    url      : Text;
    mimeType : Text;
    fileSize : Nat;
    width    : ?Nat;
    height   : ?Nat;
  };

  /// Payload for a video message.
  public type VideoContent = {
    url          : Text;
    mimeType     : Text;
    fileSize     : Nat;
    thumbnailUrl : ?Text;
    duration     : ?Nat;   // seconds
  };

  /// Payload for a voice / audio message.
  public type AudioContent = {
    url      : Text;
    mimeType : Text;
    fileSize : Nat;
    duration : ?Nat;   // seconds
  };

  /// Payload for a link-preview message.
  public type LinkContent = {
    url         : Text;
    title       : ?Text;
    description : ?Text;
    imageUrl    : ?Text;
  };

  /// Extended message content variant.
  /// Keeps backward compatibility: #text and #deleted are unchanged.
  public type MessageContent = {
    #text    : Text;
    #deleted;
    #image   : ImageContent;
    #video   : VideoContent;
    #audio   : AudioContent;
    #link    : LinkContent;
  };

  /// Input type for sendMessage — accepts any MessageContent variant.
  public type SendMessageInput = {
    conversationId : Nat;   // ConversationId (Nat)
    content        : MessageContent;
  };
};
