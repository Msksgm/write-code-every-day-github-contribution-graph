import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifest: {
    host_permissions: [
      'https://api.github.com/*'
    ]
  },
  modules: ['@wxt-dev/module-react'],
});
