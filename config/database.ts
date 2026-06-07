import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Database => ({
  connection: {
    client: 'sqlite' as const, // 💡 核心在这里：添加 as const 阻止 TS 将其推断为普通 string
    connection: {
      filename: '.tmp/data.db',
    },
    useNullAsDefault: true,
  },
});

export default config;