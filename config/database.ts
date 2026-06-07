// @ts-ignore
export default ({ env }) => ({
  connection: {
    client: 'sqlite',
    connection: {
      filename: '.tmp/data.db',
    },
    useNullAsDefault: true,
  },
});