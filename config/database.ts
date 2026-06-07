import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Database => {
  if (env('NODE_ENV') === 'production') {
    return {
      connection: {
        client: 'postgres' as const, // 加上 as const 显式指定类型
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
      client: 'sqlite' as const, // 加上 as const 显式指定类型
      connection: {
        filename: '.tmp/data.db',
      },
      useNullAsDefault: true,
    },
  };
};

export default config;