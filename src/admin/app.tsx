import { StrapiApp } from '@strapi/admin/strapi-admin';

export default {
  config: {
    locales: ['en', 'zh-Hans'],
  },
  bootstrap(app: StrapiApp) {
    // Listen for publish success and redirect to list view
    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
      const response = await originalFetch.apply(this, args);

      // Check if this is a publish action
      const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
      if (url && url.includes('/actions/publish') && response.ok) {
        // Extract the content type from the URL
        const match = url.match(/\/content-manager\/(collection-types|single-types)\/([^/]+)\/(\d+)/);
        if (match) {
          const [, collectionType, uid] = match;
          // Redirect to list view after a short delay
          setTimeout(() => {
            window.location.href = `/admin/content-manager/${collectionType}/${uid}`;
          }, 500);
        }
      }

      return response;
    };
  },
};
