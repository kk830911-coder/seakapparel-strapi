import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Database => ({
  connection: {
    client: 'postgres' as const, // 💡 核心在这里：添加 as const 阻止 TS 将其推断为普通 string
    connection: {
      connectionString: env('DATABASE_URL'),
      ssl: { rejectUnauthorized: false },
    },
    options: {
      ssl: true,
    },
  },
});

export default config;