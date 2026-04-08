import List "mo:core/List";
import Map "mo:core/Map";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Types "../types/catalog";

module {

  // ── Limits (mirrors chat-media) ──────────────────────────────────────────
  let MAX_IMAGE_BYTES : Nat = 10485760;  // 10 MB
  let MAX_VIDEO_BYTES : Nat = 52428800;  // 50 MB
  let MAX_AUDIO_BYTES : Nat = 10485760;  // 10 MB

  func isValidImageMime(mime : Text) : Bool {
    mime == "image/jpeg" or mime == "image/png" or mime == "image/gif" or mime == "image/webp"
  };
  func isValidVideoMime(mime : Text) : Bool {
    mime == "video/mp4" or mime == "video/webm"
  };
  func isValidAudioMime(mime : Text) : Bool {
    mime == "audio/mpeg" or mime == "audio/ogg" or mime == "audio/wav" or mime == "audio/webm"
  };

  // ── Conversion helpers ───────────────────────────────────────────────────

  public func toPublicRoom(self : Types.CatalogRoomInternal) : Types.CatalogRoom {
    {
      id             = self.id;
      title          = self.title;
      description    = self.description;
      coverImageUrl  = self.coverImageUrl;
      creator        = self.creator;
      createdAt      = self.createdAt;
      lastActivityAt = self.lastActivityAt;
      members        = self.members;
      messageCount   = self.messageCount;
    };
  };

  public func toPublicMessage(self : Types.CatalogMessageInternal) : Types.CatalogMessage {
    {
      id        = self.id;
      roomId    = self.roomId;
      author    = self.author;
      content   = self.content;
      createdAt = self.createdAt;
      editedAt  = self.editedAt;
      deleted   = self.deleted;
      reactions = self.reactions;
      pinned    = self.pinned;
    };
  };

  // ── Room management ──────────────────────────────────────────────────────

  public func createRoom(
    rooms : List.List<Types.CatalogRoomInternal>,
    nextRoomId : List.List<Nat>,
    title : Text,
    description : Text,
    coverImageUrl : ?Text,
    creator : Types.UserId,
  ) : Types.CatalogRoomInternal {
    let id = nextRoomId.at(0);
    let now = Time.now();
    let room : Types.CatalogRoomInternal = {
      id             = id;
      title          = title;
      description    = description;
      coverImageUrl  = coverImageUrl;
      creator        = creator;
      createdAt      = now;
      var lastActivityAt = now;
      var members    = [creator];
      var messageCount = 0;
    };
    rooms.add(room);
    nextRoomId.put(0, id + 1);
    room;
  };

  public func listRooms(
    rooms : List.List<Types.CatalogRoomInternal>,
    search : ?Text,
  ) : [Types.CatalogRoom] {
    let filtered = switch (search) {
      case null rooms;
      case (?q) {
        let lower = q.toLower();
        rooms.filter(func(r : Types.CatalogRoomInternal) : Bool {
          r.title.toLower().contains(#text lower) or
          r.description.toLower().contains(#text lower)
        });
      };
    };
    // Sort by lastActivityAt descending
    let arr = filtered.map<Types.CatalogRoomInternal, Types.CatalogRoom>(func(r) { toPublicRoom(r) }).toArray();
    arr.sort(func(a : Types.CatalogRoom, b : Types.CatalogRoom) : Order.Order {
      Int.compare(b.lastActivityAt, a.lastActivityAt)
    });
  };

  public func getRoom(
    rooms : List.List<Types.CatalogRoomInternal>,
    roomId : Types.RoomId,
  ) : ?Types.CatalogRoom {
    switch (rooms.find(func(r : Types.CatalogRoomInternal) : Bool { r.id == roomId })) {
      case null null;
      case (?r) ?toPublicRoom(r);
    };
  };

  public func joinRoom(
    rooms : List.List<Types.CatalogRoomInternal>,
    roomId : Types.RoomId,
    userId : Types.UserId,
  ) : () {
    let room = switch (rooms.find(func(r : Types.CatalogRoomInternal) : Bool { r.id == roomId })) {
      case null Runtime.trap("Room not found");
      case (?r) r;
    };
    // Only add if not already a member
    let alreadyMember = room.members.find(func(m : Types.UserId) : Bool {
      Principal.equal(m, userId)
    });
    switch (alreadyMember) {
      case (?_) {}; // already a member, no-op
      case null {
        room.members := room.members.concat([userId]);
      };
    };
  };

  public func leaveRoom(
    rooms : List.List<Types.CatalogRoomInternal>,
    roomId : Types.RoomId,
    userId : Types.UserId,
  ) : () {
    let room = switch (rooms.find(func(r : Types.CatalogRoomInternal) : Bool { r.id == roomId })) {
      case null Runtime.trap("Room not found");
      case (?r) r;
    };
    // Creators cannot leave their own room
    if (Principal.equal(room.creator, userId)) Runtime.trap("Room creator cannot leave the room");
    room.members := room.members.filter(func(m : Types.UserId) : Bool {
      not Principal.equal(m, userId)
    });
  };

  // ── Message sending with full media validation ───────────────────────────

  public func sendMediaMessage(
    rooms : List.List<Types.CatalogRoomInternal>,
    messages : List.List<Types.CatalogMessageInternal>,
    nextMessageId : List.List<Nat>,
    roomId : Types.RoomId,
    author : Types.UserId,
    content : Types.MessageContent,
  ) : Types.CatalogMessageInternal {
    let room = switch (rooms.find(func(r : Types.CatalogRoomInternal) : Bool { r.id == roomId })) {
      case null Runtime.trap("Room not found");
      case (?r) r;
    };

    // Validate MIME type and file size
    switch (content) {
      case (#image img) {
        if (not isValidImageMime(img.mimeType)) {
          Runtime.trap("Invalid image MIME type");
        };
        if (img.fileSize > MAX_IMAGE_BYTES) {
          Runtime.trap("Image exceeds maximum size of 10 MB");
        };
      };
      case (#video vid) {
        if (not isValidVideoMime(vid.mimeType)) {
          Runtime.trap("Invalid video MIME type");
        };
        if (vid.fileSize > MAX_VIDEO_BYTES) {
          Runtime.trap("Video exceeds maximum size of 50 MB");
        };
      };
      case (#audio aud) {
        if (not isValidAudioMime(aud.mimeType)) {
          Runtime.trap("Invalid audio MIME type");
        };
        if (aud.fileSize > MAX_AUDIO_BYTES) {
          Runtime.trap("Audio exceeds maximum size of 10 MB");
        };
      };
      case (#link _) {};
      case (#text _) {};
      case (#deleted) { Runtime.trap("Cannot send a deleted message") };
    };

    let id = nextMessageId.at(0);
    let now = Time.now();
    let msg : Types.CatalogMessageInternal = {
      id           = id;
      roomId       = roomId;
      author       = author;
      content      = content;
      createdAt    = now;
      var editedAt = null;
      var deleted  = false;
      var reactions = [];
      var pinned   = false;
    };
    messages.add(msg);
    nextMessageId.put(0, id + 1);

    // Update room activity
    room.lastActivityAt := now;
    room.messageCount   := room.messageCount + 1;

    msg;
  };

  public func getMessages(
    messages : List.List<Types.CatalogMessageInternal>,
    roomId : Types.RoomId,
    beforeId : ?Types.MessageId,
    pageSize : Nat,
  ) : [Types.CatalogMessage] {
    let forRoom = messages.filter(func(m : Types.CatalogMessageInternal) : Bool {
      m.roomId == roomId
    });
    let filtered = switch (beforeId) {
      case null forRoom;
      case (?bid) forRoom.filter(func(m : Types.CatalogMessageInternal) : Bool { m.id < bid });
    };
    // Newest-first, take pageSize
    let arr = filtered.toArray();
    let reversed = arr.reverse();
    let taken = reversed.sliceToArray(0, pageSize);
    taken.map<Types.CatalogMessageInternal, Types.CatalogMessage>(func(m) { toPublicMessage(m) })
  };

  // ── Moderation (soft-delete, edit) ───────────────────────────────────────

  public func deleteMessage(
    messages : List.List<Types.CatalogMessageInternal>,
    messageId : Types.MessageId,
  ) : () {
    messages.mapInPlace(func(m : Types.CatalogMessageInternal) : Types.CatalogMessageInternal {
      if (m.id == messageId) {
        // content is immutable — must return a new record
        {
          id        = m.id;
          roomId    = m.roomId;
          author    = m.author;
          content   = #deleted;
          createdAt = m.createdAt;
          var editedAt  = m.editedAt;
          var deleted   = true;
          var reactions = m.reactions;
          var pinned    = m.pinned;
        };
      } else m;
    });
  };

  public func editMessage(
    messages : List.List<Types.CatalogMessageInternal>,
    messageId : Types.MessageId,
    newText : Text,
  ) : () {
    let now = Time.now();
    messages.mapInPlace(func(m : Types.CatalogMessageInternal) : Types.CatalogMessageInternal {
      if (m.id == messageId and not m.deleted) {
        {
          id        = m.id;
          roomId    = m.roomId;
          author    = m.author;
          content   = #text newText;
          createdAt = m.createdAt;
          var editedAt  = ?now;
          var deleted   = m.deleted;
          var reactions = m.reactions;
          var pinned    = m.pinned;
        };
      } else m;
    });
  };

  // ── Reactions ────────────────────────────────────────────────────────────

  public func addReaction(
    messages : List.List<Types.CatalogMessageInternal>,
    messageId : Types.MessageId,
    emoji : Text,
    userId : Types.UserId,
  ) : () {
    messages.mapInPlace(func(m : Types.CatalogMessageInternal) : Types.CatalogMessageInternal {
      if (m.id == messageId) {
        // Build updated reactions array
        var found = false;
        let updated = m.reactions.map(func(entry) {
          if (entry.0 == emoji) {
            found := true;
            // Add userId if not already there
            let alreadyIn = entry.1.find(func(u : Types.UserId) : Bool { Principal.equal(u, userId) });
            switch (alreadyIn) {
              case (?_) entry;
              case null (emoji, entry.1.concat([userId]));
            };
          } else entry;
        });
        if (not found) {
          m.reactions := updated.concat([(emoji, [userId])]);
        } else {
          m.reactions := updated;
        };
      };
      m;
    });
  };

  public func removeReaction(
    messages : List.List<Types.CatalogMessageInternal>,
    messageId : Types.MessageId,
    emoji : Text,
    userId : Types.UserId,
  ) : () {
    messages.mapInPlace(func(m : Types.CatalogMessageInternal) : Types.CatalogMessageInternal {
      if (m.id == messageId) {
        let updated = m.reactions.filterMap(func(entry) {
          if (entry.0 == emoji) {
            let remaining = entry.1.filter(func(u : Types.UserId) : Bool {
              not Principal.equal(u, userId)
            });
            if (remaining.size() == 0) null
            else ?(emoji, remaining);
          } else ?entry;
        });
        m.reactions := updated;
      };
      m;
    });
  };

  // ── Pinning ──────────────────────────────────────────────────────────────

  public func pinMessage(
    messages : List.List<Types.CatalogMessageInternal>,
    messageId : Types.MessageId,
  ) : () {
    messages.mapInPlace(func(m : Types.CatalogMessageInternal) : Types.CatalogMessageInternal {
      if (m.id == messageId) { m.pinned := true };
      m;
    });
  };

  public func unpinMessage(
    messages : List.List<Types.CatalogMessageInternal>,
    messageId : Types.MessageId,
  ) : () {
    messages.mapInPlace(func(m : Types.CatalogMessageInternal) : Types.CatalogMessageInternal {
      if (m.id == messageId) { m.pinned := false };
      m;
    });
  };

  public func getPinnedMessages(
    messages : List.List<Types.CatalogMessageInternal>,
    roomId : Types.RoomId,
  ) : [Types.CatalogMessage] {
    messages
      .filter(func(m : Types.CatalogMessageInternal) : Bool {
        m.roomId == roomId and m.pinned and not m.deleted
      })
      .map<Types.CatalogMessageInternal, Types.CatalogMessage>(func(m) { toPublicMessage(m) })
      .toArray();
  };

  // ── Typing indicators ────────────────────────────────────────────────────

  public func setTyping(
    typing : List.List<Types.CatalogTypingEntry>,
    roomId : Types.RoomId,
    userId : Types.UserId,
  ) : () {
    let now = Time.now();
    let existing = typing.find(func(t : Types.CatalogTypingEntry) : Bool {
      t.roomId == roomId and Principal.equal(t.userId, userId)
    });
    switch (existing) {
      case (?entry) { entry.lastTypingAt := now };
      case null {
        typing.add({
          roomId           = roomId;
          userId           = userId;
          var lastTypingAt = now;
        });
      };
    };
  };

  public func getTypingUsers(
    typing : List.List<Types.CatalogTypingEntry>,
    roomId : Types.RoomId,
  ) : [Types.UserId] {
    let cutoff : Int = Time.now() - 5_000_000_000; // 5 seconds
    typing
      .filter(func(t : Types.CatalogTypingEntry) : Bool {
        t.roomId == roomId and t.lastTypingAt >= cutoff
      })
      .map<Types.CatalogTypingEntry, Types.UserId>(func(t) { t.userId })
      .toArray();
  };

  // ── Moderation helpers ───────────────────────────────────────────────────

  public func removeUser(
    rooms : List.List<Types.CatalogRoomInternal>,
    roomId : Types.RoomId,
    userId : Types.UserId,
  ) : () {
    let room = switch (rooms.find(func(r : Types.CatalogRoomInternal) : Bool { r.id == roomId })) {
      case null Runtime.trap("Room not found");
      case (?r) r;
    };
    room.members := room.members.filter(func(m : Types.UserId) : Bool {
      not Principal.equal(m, userId)
    });
  };

  public func reportRoom(
    reports : List.List<Types.CatalogReport>,
    nextReportId : List.List<Nat>,
    roomId : Types.RoomId,
    reporterId : Types.UserId,
    reason : Text,
  ) : () {
    let id = nextReportId.at(0);
    let now = Time.now();
    reports.add({
      id         = id;
      targetKind = #room;
      targetId   = roomId;
      reporterId = reporterId;
      reason     = reason;
      createdAt  = now;
    });
    nextReportId.put(0, id + 1);
  };

  public func getJoinedRooms(
    rooms : List.List<Types.CatalogRoomInternal>,
    userId : Types.UserId,
  ) : [Types.CatalogRoom] {
    rooms
      .filter(func(r : Types.CatalogRoomInternal) : Bool {
        r.members.find(func(m : Types.UserId) : Bool { Principal.equal(m, userId) }) != null
      })
      .map<Types.CatalogRoomInternal, Types.CatalogRoom>(func(r) { toPublicRoom(r) })
      .toArray();
  };

  public func getUnreadCount(
    messages : List.List<Types.CatalogMessageInternal>,
    roomId : Types.RoomId,
    lastReadAt : Int,
  ) : Nat {
    messages.filter(func(m : Types.CatalogMessageInternal) : Bool {
      m.roomId == roomId and not m.deleted and m.createdAt > lastReadAt
    }).size();
  };
};
