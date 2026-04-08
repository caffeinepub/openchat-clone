// lib/chat-media.mo
// Domain logic for sending media messages (image, video, audio, link).
// Delegates storage to the existing messages list; only the content variant differs.
// Validates MIME type and file size before storing.

import List "mo:core/List";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import ChatTypes "../types/chat";
import MediaTypes "../types/chat-media";

module {

  // ── Limits ─────────────────────────────────────────────────────────────────

  let MAX_IMAGE_BYTES : Nat = 10485760;  // 10 MB
  let MAX_VIDEO_BYTES : Nat = 52428800;  // 50 MB
  let MAX_AUDIO_BYTES : Nat = 10485760;  // 10 MB

  // ── MIME validation ────────────────────────────────────────────────────────

  func isValidImageMime(mime : Text) : Bool {
    mime == "image/jpeg" or mime == "image/png" or mime == "image/gif" or mime == "image/webp"
  };

  func isValidVideoMime(mime : Text) : Bool {
    mime == "video/mp4" or mime == "video/webm"
  };

  func isValidAudioMime(mime : Text) : Bool {
    mime == "audio/mpeg" or mime == "audio/ogg" or mime == "audio/wav" or mime == "audio/webm"
  };

  // ── Public API ─────────────────────────────────────────────────────────────

  /// Send a media message (image/video/audio/link) to a conversation.
  /// The caller must be a member of the conversation.
  /// The file URL must have already been uploaded via object-storage.
  /// Returns the created MessageInternal and the next message id.
  public func sendMediaMessage(
    conversations  : List.List<ChatTypes.ConversationInternal>,
    messages       : List.List<ChatTypes.MessageInternal>,
    nextId         : Nat,
    conversationId : ChatTypes.ConversationId,
    sender         : ChatTypes.UserId,
    content        : MediaTypes.MessageContent,
    now            : ChatTypes.Timestamp,
  ) : (ChatTypes.MessageInternal, Nat) {
    // Verify sender is a member of the conversation
    let conv = switch (conversations.find(func(c : ChatTypes.ConversationInternal) : Bool {
      c.id == conversationId
    })) {
      case null Runtime.trap("Conversation not found");
      case (?c) c;
    };
    let isMember = conv.members.find(func(m : ChatTypes.UserId) : Bool {
      Principal.equal(m, sender)
    });
    switch (isMember) {
      case null Runtime.trap("Caller is not a member of this conversation");
      case (?_) {};
    };

    // Validate MIME type and file size
    switch (content) {
      case (#image img) {
        if (not isValidImageMime(img.mimeType)) {
          Runtime.trap("Invalid image MIME type. Allowed: image/jpeg, image/png, image/gif, image/webp");
        };
        if (img.fileSize > MAX_IMAGE_BYTES) {
          Runtime.trap("Image exceeds maximum size of 10 MB");
        };
      };
      case (#video vid) {
        if (not isValidVideoMime(vid.mimeType)) {
          Runtime.trap("Invalid video MIME type. Allowed: video/mp4, video/webm");
        };
        if (vid.fileSize > MAX_VIDEO_BYTES) {
          Runtime.trap("Video exceeds maximum size of 50 MB");
        };
      };
      case (#audio aud) {
        if (not isValidAudioMime(aud.mimeType)) {
          Runtime.trap("Invalid audio MIME type. Allowed: audio/mpeg, audio/ogg, audio/wav, audio/webm");
        };
        if (aud.fileSize > MAX_AUDIO_BYTES) {
          Runtime.trap("Audio exceeds maximum size of 10 MB");
        };
      };
      case (#link _) {
        // Link previews have no file — no size/MIME restrictions
      };
      case (#text _) {
        Runtime.trap("Use sendMessage for text messages");
      };
      case (#deleted) {
        Runtime.trap("Cannot send a deleted message");
      };
    };

    // Store the message
    let msg : ChatTypes.MessageInternal = {
      id             = nextId;
      conversationId = conversationId;
      sender         = sender;
      content        = content;
      sentAt         = now;
      editedAt       = null;
    };
    messages.add(msg);

    // Update conversation metadata
    conv.lastMessageId := ?nextId;
    conv.lastMessageAt := ?now;

    (msg, nextId + 1);
  };
};
