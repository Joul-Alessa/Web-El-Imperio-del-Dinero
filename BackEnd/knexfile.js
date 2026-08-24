const path = require('path');

const DB_FILENAME = process.env.DB_FILENAME || path.join(__dirname, 'db', 'imperio_del_dinero.sqlite3');

const config = {
  client: 'sqlite3',
  connection: {
    filename: DB_FILENAME,
  },
  useNullAsDefault: true,
  migrations: {
    directory: path.join(__dirname, 'migrations'),
  },
};

module.exports = {
  development: config,
  production: config
};
