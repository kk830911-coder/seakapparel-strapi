// @ts-ignore
const config = [
  'strapi::logger',
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'https:', 'http:'],
          'img-src': ["'self'", 'data:', 'blob:', 'res.cloudinary.com', 'market-assets.strapi.io'],
          'media-src': ["'self'", 'data:', 'blob:', 'res.cloudinary.com', 'market-assets.strapi.io'],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  // 👇 这里把原来的 'strapi::cors' 替换成包含你独立站域名的详细配置
  {
    name: 'strapi::cors',
    config: {
      enabled: true,
      origin: ['https://seakapparel.com', 'https://www.seakapparel.com', 'http://localhost:3000'],
      headers: ['*'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];

export default config;