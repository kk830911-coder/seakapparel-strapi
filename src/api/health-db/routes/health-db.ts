export default {
  routes: [
    {
      method: 'GET',
      path: '/health-db',
      handler: 'health-db.index',
      config: {
        auth: false,
      },
    },
  ],
};
