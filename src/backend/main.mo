import Array "mo:core/Array";
import List "mo:core/List";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Nat8 "mo:core/Nat8";
import Blob "mo:core/Blob";
import CertifiedData "mo:core/CertifiedData";
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

  // ── Object Storage Extension ───────────────────────────────────────────────
  //
  // The Caffeine object-storage extension requires a canister method
  // `_immutableObjectStorageCreateCertificate` that stores the SHA-256 hash of
  // a file blob in IC certified data. The StorageClient calls this before
  // uploading, and the storage gateway validates the returned IC certificate to
  // authorize the upload. Without this method the gateway returns 403 Forbidden.
  //
  // Hash format: "sha256:<64 hex chars>" (stripped to 32 raw bytes for storage)
  //
  private func hexNibble(c : Char) : Nat8 {
    let n = c.toNat32().toNat();
    if (n >= 48 and n <= 57) {        // '0'..'9'
      Nat8.fromNat(n - 48)
    } else if (n >= 97 and n <= 102) { // 'a'..'f'
      Nat8.fromNat(n - 87)
    } else if (n >= 65 and n <= 70) {  // 'A'..'F'
      Nat8.fromNat(n - 55)
    } else {
      0
    }
  };

  // Decode a hex string to a Blob of raw bytes.
  // Each pair of hex characters produces one byte.
  private func hexDecode(hex : Text) : Blob {
    let chars = hex.toArray();
    let len = chars.size() / 2;
    let arr = Array.tabulate(len, func(i) {
      hexNibble(chars[i * 2]) * 16 + hexNibble(chars[i * 2 + 1])
    });
    Blob.fromArray(arr)
  };

  // Strip a known text prefix from a string.
  private func stripPrefix(s : Text, prefix : Text) : Text {
    let pLen = prefix.size();
    if (s.size() <= pLen) return s;
    var result = "";
    var i = 0;
    for (c in s.chars()) {
      if (i >= pLen) result #= c.toText();
      i += 1;
    };
    result
  };

  /// Called by the frontend StorageClient before every upload.
  /// Stores the file hash in certified data; the IC attaches the certificate
  /// to the update-call response so the storage gateway can verify it.
  public func _immutableObjectStorageCreateCertificate(hashWithPrefix : Text) : async () {
    let hexPart = stripPrefix(hashWithPrefix, "sha256:");
    CertifiedData.set(hexDecode(hexPart));
  };
};
