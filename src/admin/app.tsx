import { StrapiApp } from '@strapi/strapi/admin';

export default {
  config: {
    locales: ['en'],
  },
  bootstrap(app: StrapiApp) {
    // Clear slug field default value on new entry creation
    // This allows targetField auto-generation to work properly
    const observer = new MutationObserver(() => {
      const slugInput = document.querySelector('input[name="slug"]');
      if (slugInput) {
        const url = window.location.href;
        // Only clear on create pages (not edit pages)
        if (url.includes('/create')) {
          const currentValue = (slugInput as HTMLInputElement).value;
          // Clear if it matches common default patterns
          if (currentValue && !currentValue.includes('-') && currentValue.length < 20) {
            // Check if this looks like a content type name default
            const nameInput = document.querySelector('input[name="name"], input[name="title"]');
            if (nameInput && !(nameInput as HTMLInputElement).value) {
              // Name/title is empty, clear the slug default
              (slugInput as HTMLInputElement).value = '';
              slugInput.dispatchEvent(new Event('input', { bubbles: true }));
              slugInput.dispatchEvent(new Event('change', { bubbles: true }));
            }
          }
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  },
};
