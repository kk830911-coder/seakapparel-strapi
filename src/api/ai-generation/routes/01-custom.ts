export default {
  routes: [
    {
      method: 'POST',
      path: '/ai-generations/run-generate',
      handler: 'api::ai-generation.ai-generation.generateModel',
      config: { auth: false },
    },
    // ✨ 试衣间专用：换成绝对不会和任何数据表重名的专属路径
    {
      method: 'POST',
      path: '/seak-ai/try-on', 
      handler: 'api::ai-generation.ai-generation.runFromFittingRoom',
      config: { auth: false },
    },
  ],
};