export default {
  routes: [
    {
      method: 'POST',
      path: '/ai-generations/run-generate',
      handler: 'api::ai-generation.ai-generation.generateModel',
      config: {
        auth: false,
      },
    },
  ],
};