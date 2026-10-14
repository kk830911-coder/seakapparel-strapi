// @ts-ignore
export default ({ env }) => ({
  upload: {
    config: {
      provider: 'cloudinary',
      providerOptions: {
        cloud_name: env('CLOUDINARY_NAME'),
        api_key: env('CLOUDINARY_KEY'),
        api_secret: env('CLOUDINARY_SECRET'),
        folder: 'seakapparel', // 默认根文件夹
      },
      actionOptions: {
        upload: {
          folder: 'seakapparel/seak_products', // 测试静态文件夹
        },
        delete: {},
      },
    },
  },
});