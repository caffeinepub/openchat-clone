import List "mo:core/List";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Types "../types/catalog";
import CatalogLib "../lib/catalog";

mixin (
  catalogRooms : List.List<Types.CatalogRoomInternal>,
  catalogMessages : List.List<Types.CatalogMessageInternal>,
  catalogReports : List.List<Types.CatalogReport>,
  nextCatalogRoomId : List.List<Nat>,
  nextCatalogMessageId : List.List<Nat>,
  nextCatalogReportId : List.List<Nat>,
  catalogLastRead : Map.Map<(Principal, Types.RoomId), Int>,
  catalogTyping : List.List<Types.CatalogTypingEntry>,
) {

  // ── Key comparison for (Principal, RoomId) ───────────────────────────────
  func compareLastReadKey(
    a : (Principal, Types.RoomId),
    b : (Principal, Types.RoomId),
  ) : Order.Order {
    let cmp = Principal.compare(a.0, b.0);
    if (cmp != #equal) return cmp;
    Nat.compare(a.1, b.1);
  };

  // ── Room management ──────────────────────────────────────────────────────

  public shared ({ caller }) func createCatalogRoom(
    title : Text,
    description : Text,
    coverImageUrl : ?Text,
  ) : async Types.CatalogRoom {
    let room = CatalogLib.createRoom(
      catalogRooms,
      nextCatalogRoomId,
      title,
      description,
      coverImageUrl,
      caller,
    );
    room.toPublicRoom();
  };

  public query func getCatalogRooms(search : ?Text) : async [Types.CatalogRoom] {
    CatalogLib.listRooms(catalogRooms, search);
  };

  public query func getCatalogRoom(roomId : Types.RoomId) : async ?Types.CatalogRoom {
    CatalogLib.getRoom(catalogRooms, roomId);
  };

  public shared ({ caller }) func joinCatalogRoom(roomId : Types.RoomId) : async () {
    CatalogLib.joinRoom(catalogRooms, roomId, caller);
  };

  public shared ({ caller }) func leaveCatalogRoom(roomId : Types.RoomId) : async () {
    CatalogLib.leaveRoom(catalogRooms, roomId, caller);
  };

  // ── Messaging (full media parity with group chats) ───────────────────────

  public shared ({ caller }) func sendCatalogMediaMessage(
    input : Types.SendCatalogMediaInput,
  ) : async Types.CatalogMessage {
    let msg = CatalogLib.sendMediaMessage(
      catalogRooms,
      catalogMessages,
      nextCatalogMessageId,
      input.roomId,
      caller,
      input.content,
    );
    msg.toPublicMessage();
  };

  public query func getCatalogMessages(
    roomId : Types.RoomId,
    beforeId : ?Types.MessageId,
  ) : async [Types.CatalogMessage] {
    CatalogLib.getMessages(catalogMessages, roomId, beforeId, 50);
  };

  // ── Moderation ───────────────────────────────────────────────────────────

  public shared ({ caller }) func deleteCatalogMessage(
    roomId : Types.RoomId,
    messageId : Types.MessageId,
  ) : async () {
    // Verify caller is message author or room creator
    let msg = switch (catalogMessages.find(func(m : Types.CatalogMessageInternal) : Bool { m.id == messageId })) {
      case null Runtime.trap("Message not found");
      case (?m) m;
    };
    let room = switch (catalogRooms.find(func(r : Types.CatalogRoomInternal) : Bool { r.id == roomId })) {
      case null Runtime.trap("Room not found");
      case (?r) r;
    };
    let isAuthor  = Principal.equal(msg.author, caller);
    let isCreator = Principal.equal(room.creator, caller);
    if (not isAuthor and not isCreator) Runtime.trap("Only the message author or room creator may delete messages");
    CatalogLib.deleteMessage(catalogMessages, messageId);
  };

  public shared ({ caller }) func editCatalogMessage(
    roomId : Types.RoomId,
    messageId : Types.MessageId,
    newText : Text,
  ) : async () {
    // Verify caller is the message author
    let msg = switch (catalogMessages.find(func(m : Types.CatalogMessageInternal) : Bool { m.id == messageId })) {
      case null Runtime.trap("Message not found");
      case (?m) m;
    };
    if (not Principal.equal(msg.author, caller)) Runtime.trap("Only the message author may edit messages");
    CatalogLib.editMessage(catalogMessages, messageId, newText);
  };

  public shared ({ caller }) func removeUserFromCatalogRoom(
    roomId : Types.RoomId,
    userId : Principal,
  ) : async () {
    // Only room creator may remove users
    let room = switch (catalogRooms.find(func(r : Types.CatalogRoomInternal) : Bool { r.id == roomId })) {
      case null Runtime.trap("Room not found");
      case (?r) r;
    };
    if (not Principal.equal(room.creator, caller)) Runtime.trap("Only the room creator may remove users");
    CatalogLib.removeUser(catalogRooms, roomId, userId);
  };

  public shared ({ caller }) func reportCatalogRoom(
    roomId : Types.RoomId,
    reason : Text,
  ) : async () {
    CatalogLib.reportRoom(catalogReports, nextCatalogReportId, roomId, caller, reason);
  };

  // ── Reactions ────────────────────────────────────────────────────────────

  public shared ({ caller }) func addCatalogReaction(
    roomId : Types.RoomId,
    messageId : Types.MessageId,
    emoji : Text,
  ) : async () {
    CatalogLib.addReaction(catalogMessages, messageId, emoji, caller);
  };

  public shared ({ caller }) func removeCatalogReaction(
    roomId : Types.RoomId,
    messageId : Types.MessageId,
    emoji : Text,
  ) : async () {
    CatalogLib.removeReaction(catalogMessages, messageId, emoji, caller);
  };

  // ── Pinning ──────────────────────────────────────────────────────────────

  public shared ({ caller }) func pinCatalogMessage(
    roomId : Types.RoomId,
    messageId : Types.MessageId,
  ) : async () {
    // Only room creator may pin
    let room = switch (catalogRooms.find(func(r : Types.CatalogRoomInternal) : Bool { r.id == roomId })) {
      case null Runtime.trap("Room not found");
      case (?r) r;
    };
    if (not Principal.equal(room.creator, caller)) Runtime.trap("Only the room creator may pin messages");
    CatalogLib.pinMessage(catalogMessages, messageId);
  };

  public shared ({ caller }) func unpinCatalogMessage(
    roomId : Types.RoomId,
    messageId : Types.MessageId,
  ) : async () {
    let room = switch (catalogRooms.find(func(r : Types.CatalogRoomInternal) : Bool { r.id == roomId })) {
      case null Runtime.trap("Room not found");
      case (?r) r;
    };
    if (not Principal.equal(room.creator, caller)) Runtime.trap("Only the room creator may unpin messages");
    CatalogLib.unpinMessage(catalogMessages, messageId);
  };

  public query func getPinnedCatalogMessages(roomId : Types.RoomId) : async [Types.CatalogMessage] {
    CatalogLib.getPinnedMessages(catalogMessages, roomId);
  };

  // ── Typing indicators ────────────────────────────────────────────────────

  public shared ({ caller }) func setCatalogTyping(roomId : Types.RoomId) : async () {
    CatalogLib.setTyping(catalogTyping, roomId, caller);
  };

  public query func getCatalogTypingUsers(roomId : Types.RoomId) : async [Types.UserId] {
    CatalogLib.getTypingUsers(catalogTyping, roomId);
  };

  // ── Discovery / unread ───────────────────────────────────────────────────

  public query ({ caller }) func getJoinedCatalogRooms() : async [Types.CatalogRoom] {
    CatalogLib.getJoinedRooms(catalogRooms, caller);
  };

  public query ({ caller }) func getUnreadCatalogCount(roomId : Types.RoomId) : async Nat {
    let lastReadAt : Int = switch (catalogLastRead.get(compareLastReadKey, (caller, roomId))) {
      case null 0;
      case (?t) t;
    };
    CatalogLib.getUnreadCount(catalogMessages, roomId, lastReadAt);
  };

  public shared ({ caller }) func markCatalogRoomRead(roomId : Types.RoomId) : async () {
    let now = Time.now();
    catalogLastRead.add(compareLastReadKey, (caller, roomId), now);
  };
};
