import List "mo:core/List";
import Map "mo:core/Map";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Int "mo:core/Int";
import Runtime "mo:core/Runtime";
import Types "../types/feed";

module {

  // ── Limits (mirrors chat-media) ──────────────────────────────────────────
  let MAX_IMAGE_BYTES : Nat = 10485760;
  let MAX_VIDEO_BYTES : Nat = 52428800;
  let MAX_AUDIO_BYTES : Nat = 10485760;

  func isValidImageMime(mime : Text) : Bool {
    mime == "image/jpeg" or mime == "image/png" or mime == "image/gif" or mime == "image/webp"
  };
  func isValidVideoMime(mime : Text) : Bool {
    mime == "video/mp4" or mime == "video/webm"
  };
  func isValidAudioMime(mime : Text) : Bool {
    mime == "audio/mpeg" or mime == "audio/ogg" or mime == "audio/wav" or mime == "audio/webm"
  };

  // ── Conversion helper ─────────────────────────────────────────────────────

  public func toPublic(p : Types.PostInternal) : Types.Post {
    {
      id           = p.id;
      author       = p.author;
      content      = p.content;
      timestamp    = p.timestamp;
      likedBy      = p.likedBy;
      parentPostId = p.parentPostId;
      reactions    = p.reactions;
      pinned       = p.pinned;
    };
  };

  // ── Write operations ──────────────────────────────────────────────────────

  public func newPost(
    posts : List.List<Types.PostInternal>,
    nextId : List.List<Nat>,
    caller : Principal,
    content : Types.MessageContent,
    parentPostId : ?Types.PostId,
  ) : Types.Post {
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
      case (#deleted) { Runtime.trap("Cannot post a deleted message") };
    };

    let id = nextId.at(0);
    let now = Time.now();
    let post : Types.PostInternal = {
      id              = id;
      author          = caller;
      content         = content;
      timestamp       = now;
      var likedBy     = [];
      parentPostId    = parentPostId;
      var reactions   = [];
      var pinned      = false;
    };
    posts.add(post);
    nextId.put(0, id + 1);
    toPublic(post);
  };

  public func likePost(
    posts : List.List<Types.PostInternal>,
    postId : Types.PostId,
    caller : Principal,
  ) {
    posts.mapInPlace(func(p : Types.PostInternal) : Types.PostInternal {
      if (p.id == postId) {
        let alreadyLiked = p.likedBy.find(func(u : Types.UserId) : Bool {
          Principal.equal(u, caller)
        });
        switch (alreadyLiked) {
          case (?_) {}; // already liked, no-op
          case null { p.likedBy := p.likedBy.concat([caller]) };
        };
      };
      p;
    });
  };

  public func unlikePost(
    posts : List.List<Types.PostInternal>,
    postId : Types.PostId,
    caller : Principal,
  ) {
    posts.mapInPlace(func(p : Types.PostInternal) : Types.PostInternal {
      if (p.id == postId) {
        p.likedBy := p.likedBy.filter(func(u : Types.UserId) : Bool {
          not Principal.equal(u, caller)
        });
      };
      p;
    });
  };

  public func deletePost(
    posts : List.List<Types.PostInternal>,
    postId : Types.PostId,
    caller : Principal,
  ) {
    posts.mapInPlace(func(p : Types.PostInternal) : Types.PostInternal {
      if (p.id == postId and Principal.equal(p.author, caller)) {
        {
          id              = p.id;
          author          = p.author;
          content         = #deleted;
          timestamp       = p.timestamp;
          var likedBy     = p.likedBy;
          parentPostId    = p.parentPostId;
          var reactions   = p.reactions;
          var pinned      = p.pinned;
        };
      } else p;
    });
  };

  // ── Reactions ────────────────────────────────────────────────────────────

  public func addReaction(
    posts : List.List<Types.PostInternal>,
    postId : Types.PostId,
    emoji : Text,
    userId : Types.UserId,
  ) : () {
    posts.mapInPlace(func(p : Types.PostInternal) : Types.PostInternal {
      if (p.id == postId) {
        var found = false;
        let updated = p.reactions.map(func(entry) {
          if (entry.0 == emoji) {
            found := true;
            let alreadyIn = entry.1.find(func(u : Types.UserId) : Bool { Principal.equal(u, userId) });
            switch (alreadyIn) {
              case (?_) entry;
              case null (emoji, entry.1.concat([userId]));
            };
          } else entry;
        });
        if (not found) {
          p.reactions := updated.concat([(emoji, [userId])]);
        } else {
          p.reactions := updated;
        };
      };
      p;
    });
  };

  public func removeReaction(
    posts : List.List<Types.PostInternal>,
    postId : Types.PostId,
    emoji : Text,
    userId : Types.UserId,
  ) : () {
    posts.mapInPlace(func(p : Types.PostInternal) : Types.PostInternal {
      if (p.id == postId) {
        let updated = p.reactions.filterMap(func(entry) {
          if (entry.0 == emoji) {
            let remaining = entry.1.filter(func(u : Types.UserId) : Bool {
              not Principal.equal(u, userId)
            });
            if (remaining.size() == 0) null
            else ?(emoji, remaining);
          } else ?entry;
        });
        p.reactions := updated;
      };
      p;
    });
  };

  // ── Pinning (feed post room — only post author / creator may pin replies) ─

  public func pinReply(
    posts : List.List<Types.PostInternal>,
    replyId : Types.PostId,
  ) : () {
    posts.mapInPlace(func(p : Types.PostInternal) : Types.PostInternal {
      if (p.id == replyId) { p.pinned := true };
      p;
    });
  };

  public func unpinReply(
    posts : List.List<Types.PostInternal>,
    replyId : Types.PostId,
  ) : () {
    posts.mapInPlace(func(p : Types.PostInternal) : Types.PostInternal {
      if (p.id == replyId) { p.pinned := false };
      p;
    });
  };

  public func getPinnedReplies(
    posts : List.List<Types.PostInternal>,
    postId : Types.PostId,
  ) : [Types.Post] {
    posts
      .filter(func(p : Types.PostInternal) : Bool {
        p.parentPostId == ?postId and p.pinned
      })
      .map<Types.PostInternal, Types.Post>(func(p) { toPublic(p) })
      .toArray();
  };

  // ── Typing indicators ────────────────────────────────────────────────────

  public func setTyping(
    typing : List.List<Types.FeedTypingEntry>,
    postId : Types.PostId,
    userId : Types.UserId,
  ) : () {
    let now = Time.now();
    let existing = typing.find(func(t : Types.FeedTypingEntry) : Bool {
      t.postId == postId and Principal.equal(t.userId, userId)
    });
    switch (existing) {
      case (?entry) { entry.lastTypingAt := now };
      case null {
        typing.add({
          postId           = postId;
          userId           = userId;
          var lastTypingAt = now;
        });
      };
    };
  };

  public func getTypingUsers(
    typing : List.List<Types.FeedTypingEntry>,
    postId : Types.PostId,
  ) : [Types.UserId] {
    let cutoff : Int = Time.now() - 5_000_000_000; // 5 seconds
    typing
      .filter(func(t : Types.FeedTypingEntry) : Bool {
        t.postId == postId and t.lastTypingAt >= cutoff
      })
      .map<Types.FeedTypingEntry, Types.UserId>(func(t) { t.userId })
      .toArray();
  };

  // ── Read operations ───────────────────────────────────────────────────────

  public func listPosts(
    posts : List.List<Types.PostInternal>,
    offset : Nat,
    limit : Nat,
  ) : Types.FeedPage {
    // Top-level posts only (no replies)
    let topLevel = posts.filter(func(p : Types.PostInternal) : Bool {
      p.parentPostId == null
    });
    let total = topLevel.size();
    // Newest-first
    let arr = topLevel.toArray().reverse();
    let page = arr.sliceToArray(offset, offset + limit);
    {
      posts = page.map<Types.PostInternal, Types.Post>(func(p) { toPublic(p) });
      total = total;
    };
  };

  public func getPostLikes(
    posts : List.List<Types.PostInternal>,
    postId : Types.PostId,
  ) : [Types.UserId] {
    switch (posts.find(func(p : Types.PostInternal) : Bool { p.id == postId })) {
      case null [];
      case (?p) p.likedBy;
    };
  };

  public func getPostReplies(
    posts : List.List<Types.PostInternal>,
    postId : Types.PostId,
  ) : [Types.Post] {
    posts
      .filter(func(p : Types.PostInternal) : Bool { p.parentPostId == ?postId })
      .map<Types.PostInternal, Types.Post>(func(p) { toPublic(p) })
      .toArray();
  };

  // ── Unread tracking ───────────────────────────────────────────────────────

  public func getUnreadCount(
    posts : List.List<Types.PostInternal>,
    lastRead : Map.Map<Principal, Int>,
    caller : Principal,
  ) : Nat {
    let lastReadAt : Int = switch (lastRead.get(caller)) {
      case null 0;
      case (?t) t;
    };
    posts.filter(func(p : Types.PostInternal) : Bool {
      p.parentPostId == null and p.timestamp > lastReadAt
    }).size();
  };

  public func markRead(
    lastRead : Map.Map<Principal, Int>,
    caller : Principal,
  ) {
    let now = Time.now();
    lastRead.add(caller, now);
  };
};
