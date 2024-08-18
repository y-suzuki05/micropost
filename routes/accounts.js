const express = require("express");
const router = express.Router();
const knex = require("../db/knex");
const bcrypt = require("bcrypt");
const passport = require("passport");

router.get("/signup", function (req, res, next) {
  const isAuth = req.isAuthenticated();

  res.render("accounts/signup", {
    title: "Sign up",
    isAuth: isAuth,
  });
});

router.post("/signup", function (req, res, next) {
  const isAuth = req.isAuthenticated();

  const username = req.body.username;
  const email = req.body.email;
  const password = req.body.password;
  const repassword = req.body.repassword;
  const isAdmin = req.body.isAdmin === "true" ? true : false;

  knex("users")
    .where({ name: username })
    .orWhere({ email: email })
    .then(async function (results) {
      if (results.length !== 0) {
        res.render("accounts/signup", {
          title: "Sign up",
          errorMessage: [
            "このユーザー名もしくはメールアドレスは既に使われています",
          ],
          isAuth: isAuth,
        });
      } else if (password === repassword) {
        const hashedPassword = await bcrypt.hash(password, 10);
        knex("users")
          .insert({
            name: username,
            email: email,
            password: hashedPassword,
            isadmin: isAdmin,
          })
          .then(function () {
            // res.redirect("/");

            // 登録したユーザーを取得
            knex("users")
              .where({ email: email })
              .first()
              .then(function (user) {
                // ユーザーをログインさせる
                req.login(user, function (err) {
                  if (err) {
                    console.error(err);
                    return next(err);
                  }
                  // トップページにリダイレクト
                  return res.redirect("/");
                });
              });
          })
          .catch(function (err) {
            console.error(err);
            res.render("accounts/signup", {
              title: "Sign up",
              errorMessage: [err.sqlMessage],
              isAuth: isAuth,
            });
          });
      } else {
        res.render("accounts/signup", {
          title: "Sign up",
          errorMessage: ["パスワードが一致しません"],
          isAuth: isAuth,
        });
      }
    })
    .catch(function (err) {
      console.error(err);
      res.render("accounts/signup", {
        title: "Sign up",
        errorMessage: [err.sqlMessage],
        isAuth: isAuth,
      });
    });
});

router.get("/signin", function (req, res, next) {
  const isAuth = req.isAuthenticated();

  res.render("accounts/signin", {
    title: "Sign in",
    isAuth: isAuth,
  });
});

router.post(
  "/signin",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/accounts/signin",
    failureFlash: true,
  })
);

router.get("/logout", function (req, res, next) {
  req.logout();
  res.redirect("/");
});

router.get("/edit", function (req, res, next) {
  const isAuth = req.isAuthenticated();
  const currentUser = req.user;

  res.render("accounts/edit", {
    title: "Update your profile",
    isAuth: isAuth,
    currentUser: currentUser,
  });
});

router.post("/edit", function (req, res, next) {
  const isAuth = req.isAuthenticated();
  const currentUser = req.user;

  const username = req.body.username;
  const email = req.body.email;
  const password = req.body.password;
  const repassword = req.body.repassword;
  const isAdmin = req.body.isAdmin === "true" ? true : false;

  knex("users")
    .then(async function (results) {
      if (password === repassword) {
        const hashedPassword = await bcrypt.hash(password, 10);
        knex("users")
          .where({id: currentUser.id})
          .update({
            name: username,
            email: email,
            password: hashedPassword,
            isadmin: isAdmin,
          })
          .then(function () {
            res.render("accounts/edit", {
              title: "Update your profile",
              isAuth: isAuth,
              currentUser: currentUser,
            })
          })
          .catch(function (err) {
            console.error(err);
            res.render("accounts/edit", {
              title: "Update your profile",
              errorMessage: [err.sqlMessage],
              isAuth: isAuth,
            });
          });
      } else {
        res.render("accounts/edit", {
          title: "Update your profile",
          errorMessage: ["パスワードが一致しません"],
          isAuth: isAuth,
        });
      }
    })
    .catch(function (err) {
      console.error(err);
      res.render("accounts/edit", {
        title: "Update your profile",
        errorMessage: [err.sqlMessage],
        isAuth: isAuth,
      });
    });
});

module.exports = router;
