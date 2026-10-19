export default {
  async index(ctx) {
    try {
      await strapi.db.connection.raw('SELECT 1');
      ctx.body = { status: 'ok', timestamp: new Date().toISOString() };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { status: 'error', message: error.message };
    }
  },
};
