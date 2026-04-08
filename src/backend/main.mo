import List "mo:core/List";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Types "types/chat";
import ReactTypes "types/reactions-and-typing";
import SPETypes "types/search-pin-edit";
import FeedTypes "types/feed";
import CatalogTypes "types/catalog";
import ChatApi "mixins/chat-api";
import ChatMediaApi "mixins/chat-media-api";
import ReactApi "mixins/reactions-and-typing-api";
import SPEApi "mixins/search-pin-edit-api";
import FeedApi "mixins/feed-api";
import CatalogApi "mixins/catalog-api";



actor {
  // ── Persistent state (var ensures data survives upgrades and redeployments) ─
  var profiles : Map.Map<Types.UserId, Types.UserProfile> = Map.empty();
  var conversations : List.List<Types.ConversationInternal> = List.empty();
  var messages : List.List<Types.MessageInternal> = List.empty();
  var readReceipts : Map.Map<(Types.UserId, Types.ConversationId), Types.ReadReceipt> = Map.empty();
  // Single-element lists used as mutable counters (passed by reference to mixins)
  var nextConversationId : List.List<Nat> = List.singleton(0);
  var nextMessageId : List.List<Nat> = List.singleton(0);
  // Reactions: keyed by (messageId, userId)
  var reactions : Map.Map<(ReactTypes.MessageId, ReactTypes.UserId), ReactTypes.ReactionEntry> = Map.empty();
  // Typing indicators: keyed by (conversationId, userId)
  var typing : Map.Map<(ReactTypes.ConversationId, ReactTypes.UserId), ReactTypes.TypingEntry> = Map.empty();
  // Search / pin / edit state
  var pins : List.List<SPETypes.PinEntry> = List.empty();
  var editHistories : Map.Map<SPETypes.MessageId, SPETypes.EditHistory> = Map.empty();
  // Feed state
  var feedPosts : List.List<FeedTypes.PostInternal> = List.empty();
  var nextPostId : List.List<Nat> = List.singleton(0);
  var feedLastRead : Map.Map<Principal, Int> = Map.empty();
  var feedTyping : List.List<FeedTypes.FeedTypingEntry> = List.empty();
  // Catalog state
  var catalogRooms : List.List<CatalogTypes.CatalogRoomInternal> = List.empty();
  var catalogMessages : List.List<CatalogTypes.CatalogMessageInternal> = List.empty();
  var catalogReports : List.List<CatalogTypes.CatalogReport> = List.empty();
  var nextCatalogRoomId : List.List<Nat> = List.singleton(0);
  var nextCatalogMessageId : List.List<Nat> = List.singleton(0);
  var nextCatalogReportId : List.List<Nat> = List.singleton(0);
  var catalogLastRead : Map.Map<(Principal, CatalogTypes.RoomId), Int> = Map.empty();
  var catalogTyping : List.List<CatalogTypes.CatalogTypingEntry> = List.empty();

  // ── Mixin composition ─────────────────────────────────────────────────────
  include ChatApi(profiles, conversations, messages, readReceipts, nextConversationId, nextMessageId);
  include ChatMediaApi(conversations, messages, nextMessageId);
  include ReactApi(reactions, typing, profiles);
  include SPEApi(messages, conversations, pins, editHistories);
  include FeedApi(feedPosts, nextPostId, feedLastRead, feedTyping);
  include CatalogApi(catalogRooms, catalogMessages, catalogReports, nextCatalogRoomId, nextCatalogMessageId, nextCatalogReportId, catalogLastRead, catalogTyping);
};
