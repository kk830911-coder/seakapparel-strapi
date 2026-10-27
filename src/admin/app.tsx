import { StrapiApp } from '@strapi/strapi/admin';

// Simple slug generation function
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
}

export default {
  config: {
    locales: ['en'],
  },
  bootstrap(app: StrapiApp) {
    let slugCleared = false;
    let nameFieldListenerAdded = false;

    const observer = new MutationObserver(() => {
      const slugInput = document.querySelector('input[name="slug"]') as HTMLInputElement;
      const nameInput = document.querySelector('input[name="name"], input[name="title"]') as HTMLInputElement;

      if (slugInput && nameInput) {
        const url = window.location.href;

        // Only on create pages
        if (url.includes('/create')) {
          // Clear slug field default value
          if (!slugCleared) {
            const currentValue = slugInput.value;
            // Clear if it looks like a default value (short, no hyphens, matches content type name pattern)
            if (currentValue && !currentValue.includes('-') && currentValue.length < 30) {
              slugInput.value = '';
              slugInput.dispatchEvent(new Event('input', { bubbles: true }));
              slugInput.dispatchEvent(new Event('change', { bubbles: true }));
              slugCleared = true;
            }
          }

          // Add listener to name/title field for auto-generating slug
          if (!nameFieldListenerAdded && slugCleared) {
            nameField.addEventListener('blur', () => {
              const nameValue = nameInput.value.trim();
              const slugValue = slugInput.value.trim();

              // Only auto-generate if slug is empty or looks like a default value
              if (nameValue && (!slugValue || !slugValue.includes('-') || slugValue.length < 10)) {
                const newSlug = generateSlug(nameValue);
                if (newSlug && newSlug !== slugValue) {
                  slugInput.value = newSlug;
                  slugInput.dispatchEvent(new Event('input', { bubbles: true }));
                  slugInput.dispatchEvent(new Event('change', { bubbles: true }));
                }
              }
            });

            // Also listen to input events for real-time updates
            let inputTimeout: NodeJS.Timeout;
            nameField.addEventListener('input', () => {
              clearTimeout(inputTimeout);
              inputTimeout = setTimeout(() => {
                const nameValue = nameInput.value.trim();
                const slugValue = slugInput.value.trim();

                // Only auto-generate if slug is empty or looks like a default value
                if (nameValue && (!slugValue || !slugValue.includes('-') || slugValue.length < 10)) {
                  const newSlug = generateSlug(nameValue);
                  if (newSlug && newSlug !== slugValue) {
                    slugInput.value = newSlug;
                    slugInput.dispatchEvent(new Event('input', { bubbles: true }));
                    slugInput.dispatchEvent(new Event('change', { bubbles: true }));
                  }
                }
              }, 500); // Wait 500ms after user stops typing
            });

            nameFieldListenerAdded = true;
          }
        } else {
          // Reset flags when not on create page
          slugCleared = false;
          nameFieldListenerAdded = false;
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  },
};
