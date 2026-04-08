import Map "mo:core/Map";
import Time "mo:core/Time";
import Types "../types/reactions-and-typing";
import ChatTypes "../types/chat";
import ReactLib "../lib/reactions-and-typing";

mixin (
  reactions : Map.Map<(Types.MessageId, Types.UserId), Types.ReactionEntry>,
  typing : Map.Map<(Types.ConversationId, Types.UserId), Types.TypingEntry>,
  profiles : Map.Map<ChatTypes.UserId, ChatTypes.UserProfile>,
) {

  // ── Reactions ─────────────────────────────────────────────────────────────

  /// Add an emoji reaction to a message. Replaces any previous reaction by this caller on the same message.
  public shared ({ caller }) func addReaction(messageId : Types.MessageId, emoji : Text) : async () {
    let now = Time.now();
    ReactLib.addReaction(reactions, messageId, caller, emoji, now);
  };

  /// Remove the caller's reaction from a message.
  public shared ({ caller }) func removeReaction(messageId : Types.MessageId) : async () {
    ReactLib.removeReaction(reactions, messageId, caller);
  };

  /// Fetch all reactions for a message grouped by emoji with counts and user IDs.
  public query func getReactions(messageId : Types.MessageId) : async [Types.ReactionGroup] {
    ReactLib.getReactions(reactions, messageId);
  };

  // ── Typing indicators ─────────────────────────────────────────────────────

  /// Set the caller's typing status in a conversation.
  /// Pass `true` to mark as typing; `false` to clear.
  public shared ({ caller }) func setTyping(conversationId : Types.ConversationId, isTyping : Bool) : async () {
    let now = Time.now();
    ReactLib.setTyping(typing, conversationId, caller, isTyping, now);
  };

  /// Return user profiles of everyone currently typing in a conversation.
  /// Results exclude entries older than 5 seconds.
  public query func getTypingUsers(conversationId : Types.ConversationId) : async [ChatTypes.UserProfile] {
    let now = Time.now();
    ReactLib.getTypingUsers(typing, profiles, conversationId, now);
  };
};
