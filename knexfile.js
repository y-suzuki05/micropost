// Update with your config settings.

module.exports = {
  development: {
    client: "mysql",
    connection: {
      database: "Micropost",
      user: "root",
      password: "Zihen0229!",
      host: '127.0.0.1',
    },
    pool: {
      min: 2,
      max: 10,
    },
  },

  staging: {
    client: "mysql",
    connection: {
      database: "Micropost",
      user: "root",
      password: "Zihen0229!",
    },
    pool: {
      min: 2,
      max: 10,
    },
  },

  production: {
    client: "mysql",
    connection: {
      database: "Micropost",
      user: "root",
      password: "Zihen0229!",
    },
    pool: {
      min: 2,
      max: 10,
    },
  },
};
