// mixins/chat-media-api.mo
// Public API surface for media messages.
// Extends the actor without touching any existing chat-api methods.
// The frontend uploads the file to object-storage first, then calls
// sendMediaMessage with the resulting URL.

import List "mo:core/List";
import Time "mo:core/Time";
import ChatTypes "../types/chat";
import MediaTypes "../types/chat-media";
import ChatMediaLib "../lib/chat-media";

mixin (
  conversations  : List.List<ChatTypes.ConversationInternal>,
  messages       : List.List<ChatTypes.MessageInternal>,
  nextMessageId  : List.List<Nat>,
) {

  /// Send a media message (image, video, audio, or link) to a conversation.
  /// The caller must be a member of the conversation.
  /// File must already be uploaded via object-storage; pass the resulting URL
  /// in the content payload. MIME type and file size are validated server-side.
  public shared ({ caller }) func sendMediaMessage(
    input : MediaTypes.SendMessageInput
  ) : async ChatTypes.Message {
    let now = Time.now();
    let (msg, newId) = ChatMediaLib.sendMediaMessage(
      conversations,
      messages,
      nextMessageId.at(0),
      input.conversationId,
      caller,
      input.content,
      now,
    );
    nextMessageId.put(0, newId);
    {
      id             = msg.id;
      conversationId = msg.conversationId;
      sender         = msg.sender;
      content        = msg.content;
      sentAt         = msg.sentAt;
    };
  };
};
