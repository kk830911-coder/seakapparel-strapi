// config/database.js
module.exports = ({ env }) => {
  if (env('NODE_ENV') === 'production') {
    return {
      connection: {
        client: 'postgres',
        connection: {
          connectionString: env('DATABASE_URL'),
          ssl: { rejectUnauthorized: false },
        },
        options: {
          ssl: true,
        },
      },
    };
  }

  // 本地开发依然用 SQLite
  return {
    connection: {
      client: 'sqlite',
      connection: {
        filename: '.tmp/data.db',
      },
      useNullAsDefault: true,
    },
  };
};