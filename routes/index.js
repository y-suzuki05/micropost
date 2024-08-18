const express = require("express");
const router = express.Router();
const knex = require("../db/knex");

// 投稿時の日時を取得
function getCurrentDate() {
  const now = new Date();
  return now;
}

// 投稿日時を表示する際に整形
function formatDate(date) {
  const y = date.getFullYear();
  const m = ("00" + (date.getMonth() + 1)).slice(-2);
  const d = ("00" + date.getDate()).slice(-2);
  const h = ("00" + date.getHours()).slice(-2)
  const min = ("00" + date.getMinutes()).slice(-2)
  const result = `${y}年${m}月${d}日${h}時${min}分`;
  return result;
}

// トップページに表示するための、すべての投稿を取得
async function getAllPosts() {
  return await knex("microposts")
    .leftJoin("users", "microposts.user_id", "=", "users.id")
    .select(
      "users.id as user_id",
      "users.name",
      "microposts.id as microposts_id",
      "microposts.content",
      "microposts.user_id as microposts_user_id",
      "microposts.created_at"
    )
    .orderBy("microposts.created_at", "desc")
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

router.get("/", async function (req, res, next) {
  const isAuth = req.isAuthenticated();
  const currentUser = req.user;

  try {
    const userId = currentUser.id;
    const data = await getAllPosts();
    const microPosts = data.map((post) => {
      return {
        ...post,
        created_at: formatDate(post.created_at),
      };
    });
    const { name, postCount, followingCount, followerCount } =
      await getUserInfo(userId);

    res.render("index", {
      title: "MicroPost",
      isAuth: isAuth,
      currentUser: currentUser,
      microPosts: microPosts,
      name: name,
      postCount: postCount[0].CNT,
      followingCount: followingCount[0].CNT,
      followerCount: followerCount[0].CNT,
    });
  } catch (err) {
    console.error(err);
    res.render("index", {
      title: "MicroPost",
      isAuth: isAuth,
      currentUser: currentUser,
    });
  }
});

router.post("/", function (req, res, next) {
  const isAuth = req.isAuthenticated();
  const userId = req.user.id;
  const createdData = getCurrentDate();
  const microPost = req.body.post;

  knex("microposts")
    .insert({ user_id: userId, content: microPost, created_at: createdData })
    .then(function () {
      res.redirect("/");
    })
    .catch(function (err) {
      console.error(err);
      res.render("index", {
        title: "MicroPost",
        isAuth: isAuth,
      });
    });
});

// 自分の投稿を削除する
router.post("/posts/:postId/delete", async (req, res) => {
  const postId = parseInt(req.params.postId);

  try {
    await knex("microposts").where({ id: postId }).delete();
    res.redirect(`/`);
  } catch (err) {
    console.error(err);
  }
});

router.use("/accounts", require("./accounts"));
router.use("/users", require("./users"));

module.exports = router;
