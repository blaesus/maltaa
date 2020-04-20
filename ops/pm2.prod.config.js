module.exports = {
  apps : [
    {
      name: 'api',
      script: 'server/restlike-api.js',
      cwd: 'server',
      time: true,
    },
    {
      name: 'spider',
      script: 'server/spider.js',
      cwd: 'server',
      time: true,
    },
  ],
};
