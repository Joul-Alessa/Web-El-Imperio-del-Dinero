import type { Knex } from 'knex';

const config: Knex.Config = {
  client: 'better-sqlite3',
  connection: {
    filename: './data.db',
  },
  useNullAsDefault: true,
  migrations: {
    directory: './migrations',
    extension: 'ts',
  },
};

export default config;
