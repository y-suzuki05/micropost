const express = require("express");
const router = express.Router();
const knex = require("../db/knex");

// 特定のユーザーの投稿内容を取得
async function getUserAndPostsById(userId) {
  const posts = await knex("microposts")
    .join("users", "microposts.user_id", "=", "users.id")
    .where({ user_id: userId })
    .select("microposts.content", "microposts.id", "users.name");
  return { posts };
}

// 特定のユーザーの情報を取得（名前、投稿数、フォロー数、フォロワー数）
async function getUserInfo(userId) {
  const name = await knex("users").where({ id: userId }).first("name");
  const postCount = await knex("microposts")
    .where({ user_id: userId })
    .count("user_id as CNT");
  const followingCount = await knex("relationships")
    .where({ follower_id: userId })
    .count("follower_id as CNT");
  const followerCount = await knex("relationships")
    .where({ followed_id: userId })
    .count("followed_id as CNT");
  return { name, postCount, followingCount, followerCount };
}

// フォローしているユーザーの情報を取得（名前、ID）
async function getFollowingUsers(userId) {
  const followingUsers = await knex("relationships")
    .join("users", "relationships.followed_id", "=", "users.id")
    .where({ follower_id: userId })
    .select("users.name", "users.id");
  return { followingUsers };
}

// フォローされているユーザーの情報を取得（名前、ID）
async function getFollowerUsers(userId) {
  const followerUsers = await knex("relationships")
    .join("users", "relationships.follower_id", "=", "users.id")
    .where({ followed_id: userId })
    .select("users.name", "users.id");
  return { followerUsers };
}

// ユーザー一覧ページ
router.get("/", function (req, res, next) {
  const isAuth = req.isAuthenticated();
  const currentUser = req.user;

  knex("users")
    .select("*")
    .then(function (results) {
      res.render("users/list", {
        title: "All Users",
        users: results,
        isAuth: isAuth,
        currentUser: currentUser,
      });
    });
});

// ユーザー削除（管理者のみ）
router.post("/:userId/delete", async (req, res) => {
  const userId = parseInt(req.params.userId);

  try {
    await knex("users").where({ id: userId }).delete();
    await knex("relationships")
      .where({ follower_id: userId })
      .orWhere({ followed_id: userId })
      .delete()
    res.redirect(`/users`);
  } catch (err) {
    console.error(err);
  }
});

// プロフィールページ
router.get("/:id", async function (req, res, next) {
  const isAuth = req.isAuthenticated();
  const currentUser = req.user;
  const userId = req.params.id;
  const currentUserId = currentUser.id;

  try {
    const { posts } = await getUserAndPostsById(userId);
    const { name, postCount, followingCount, followerCount } =
      await getUserInfo(currentUserId);

    const relation = await knex("relationships")
      .where({
        followed_id: userId,
        follower_id: currentUserId,
      })
      .first();
    const isFollowing = !!relation;

    res.render("users/profile", {
      title: "Profile",
      isAuth: isAuth,
      currentUser: currentUser,
      posts: posts,
      isFollowing: isFollowing,
      userId: userId,
      name: name,
      postCount: postCount[0].CNT,
      followingCount: followingCount[0].CNT,
      followerCount: followerCount[0].CNT,
    });
  } catch (err) {
    console.error(err);
  }
});

// 自分の投稿を削除する
router.post("/:id/posts/:postId/delete", async (req, res) => {
  const postId = parseInt(req.params.postId);
  const userId = req.params.id;

  try {
    await knex("microposts").where({ id: postId }).delete();
    res.redirect(`/users/${userId}`);
  } catch (err) {
    console.error(err);
  }
});

// フォローする
router.post("/:id/follow", async (req, res) => {
  const followedId = parseInt(req.params.id);
  const currentUser = req.user;
  const followerId = currentUser.id;

  try {
    const existingRelation = await knex("relationships")
      .where({
        followed_id: followedId,
        follower_id: followerId,
      })
      .first();

    if (!existingRelation) {
      await knex("relationships").insert({
        followed_id: followedId,
        follower_id: followerId,
      });
      res.redirect("/users");
    } else {
      res.status(400).send("Already following");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Error following user");
  }
});

// フォロー解除する
router.post("/:id/unfollow", async (req, res) => {
  const followedId = parseInt(req.params.id);
  const currentUser = req.user;
  const followerId = currentUser.id;

  try {
    await knex("relationships")
      .where({
        followed_id: followedId,
        follower_id: followerId,
      })
      .del();
    res.redirect("/users");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error unfollowing user");
  }
});

// フォローユーザー一覧ページ
router.get("/:id/following", async function (req, res, next) {
  const isAuth = req.isAuthenticated();
  const currentUser = req.user;
  const currentUserId = currentUser.id;

  try {
    const { followingUsers } = await getFollowingUsers(currentUserId);
    const { name, postCount, followingCount, followerCount } =
      await getUserInfo(currentUserId);

    res.render("users/following", {
      title: "Following",
      isAuth: isAuth,
      currentUser: currentUser,
      followingUsers: followingUsers,
      name: name,
      postCount: postCount[0].CNT,
      followingCount: followingCount[0].CNT,
      followerCount: followerCount[0].CNT,
    });
  } catch (err) {
    console.error(err);
  }
});

// フォロワーユーザー一覧ページ
router.get("/:id/followers", async function (req, res, next) {
  const isAuth = req.isAuthenticated();
  const currentUser = req.user;
  const currentUserId = currentUser.id;

  try {
    const { followerUsers } = await getFollowerUsers(currentUserId);
    const { name, postCount, followingCount, followerCount } =
      await getUserInfo(currentUserId);

    res.render("users/followers", {
      title: "Followers",
      isAuth: isAuth,
      currentUser: currentUser,
      followerUsers: followerUsers,
      name: name,
      postCount: postCount[0].CNT,
      followingCount: followingCount[0].CNT,
      followerCount: followerCount[0].CNT,
    });
  } catch (err) {
    console.error(err);
  }
});

module.exports = router;
