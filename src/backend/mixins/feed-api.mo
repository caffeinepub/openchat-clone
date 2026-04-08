import List "mo:core/List";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Types "../types/feed";
import FeedLib "../lib/feed";

mixin (
  posts : List.List<Types.PostInternal>,
  nextPostId : List.List<Nat>,
  feedLastRead : Map.Map<Principal, Int>,
  feedTyping : List.List<Types.FeedTypingEntry>,
) {

  // ── Top-level posts ───────────────────────────────────────────────────────

  public shared ({ caller }) func createPost(
    input : Types.SendFeedMediaInput,
  ) : async Types.Post {
    FeedLib.newPost(posts, nextPostId, caller, input.content, null);
  };

  public query func getFeedPosts(offset : Nat, limit : Nat) : async Types.FeedPage {
    FeedLib.listPosts(posts, offset, limit);
  };

  public shared ({ caller }) func likePost(postId : Types.PostId) : async () {
    FeedLib.likePost(posts, postId, caller);
  };

  public shared ({ caller }) func unlikePost(postId : Types.PostId) : async () {
    FeedLib.unlikePost(posts, postId, caller);
  };

  public query func getPostLikes(postId : Types.PostId) : async [Types.UserId] {
    FeedLib.getPostLikes(posts, postId);
  };

  public shared ({ caller }) func deletePost(postId : Types.PostId) : async () {
    FeedLib.deletePost(posts, postId, caller);
  };

  // ── Replies (each post is a chatroom — full media parity) ────────────────

  public shared ({ caller }) func addReply(
    postId : Types.PostId,
    input : Types.SendFeedMediaInput,
  ) : async Types.Post {
    // Verify parent post exists
    switch (posts.find(func(p : Types.PostInternal) : Bool { p.id == postId })) {
      case null Runtime.trap("Post not found");
      case (?_) {};
    };
    FeedLib.newPost(posts, nextPostId, caller, input.content, ?postId);
  };

  public query func getPostReplies(postId : Types.PostId) : async [Types.Post] {
    FeedLib.getPostReplies(posts, postId);
  };

  // ── Reactions ─────────────────────────────────────────────────────────────

  public shared ({ caller }) func addFeedReaction(
    postId : Types.PostId,
    emoji : Text,
  ) : async () {
    FeedLib.addReaction(posts, postId, emoji, caller);
  };

  public shared ({ caller }) func removeFeedReaction(
    postId : Types.PostId,
    emoji : Text,
  ) : async () {
    FeedLib.removeReaction(posts, postId, emoji, caller);
  };

  // ── Pinning (post creator may pin replies in their post chatroom) ─────────

  public shared ({ caller }) func pinFeedReply(
    postId : Types.PostId,
    replyId : Types.PostId,
  ) : async () {
    // Only the post author may pin
    let post = switch (posts.find(func(p : Types.PostInternal) : Bool { p.id == postId })) {
      case null Runtime.trap("Post not found");
      case (?p) p;
    };
    if (not Principal.equal(post.author, caller)) Runtime.trap("Only the post author may pin replies");
    FeedLib.pinReply(posts, replyId);
  };

  public shared ({ caller }) func unpinFeedReply(
    postId : Types.PostId,
    replyId : Types.PostId,
  ) : async () {
    let post = switch (posts.find(func(p : Types.PostInternal) : Bool { p.id == postId })) {
      case null Runtime.trap("Post not found");
      case (?p) p;
    };
    if (not Principal.equal(post.author, caller)) Runtime.trap("Only the post author may unpin replies");
    FeedLib.unpinReply(posts, replyId);
  };

  public query func getPinnedFeedReplies(postId : Types.PostId) : async [Types.Post] {
    FeedLib.getPinnedReplies(posts, postId);
  };

  // ── Typing indicators ─────────────────────────────────────────────────────

  public shared ({ caller }) func setFeedTyping(postId : Types.PostId) : async () {
    FeedLib.setTyping(feedTyping, postId, caller);
  };

  public query func getFeedTypingUsers(postId : Types.PostId) : async [Types.UserId] {
    FeedLib.getTypingUsers(feedTyping, postId);
  };

  // ── Unread tracking ───────────────────────────────────────────────────────

  public shared ({ caller }) func getUnreadFeedCount() : async Nat {
    FeedLib.getUnreadCount(posts, feedLastRead, caller);
  };

  public shared ({ caller }) func markFeedRead() : async () {
    FeedLib.markRead(feedLastRead, caller);
  };
};
