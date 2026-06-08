import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Server => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  app: {
    keys: env.array('APP_KEYS', [
      '0+G9m8fHoLq/1YaegV+5+w==',
      'vm0oaQVhPegZGncGfhUfIg=='
    ]),
  },
});

export default config;