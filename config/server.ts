export default [
  'strapi::errors',
  'strapi::security',
  {
    name: 'strapi::cors',
    config: {
      enabled: true,
      origin: ['https://seakapparel.com', 'https://www.seakapparel.com', 'http://localhost:3000'], // 顺便把本地前端地址也加上，方便你本地调试
      headers: ['*'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::logger',
  'strapi::taiload',
];