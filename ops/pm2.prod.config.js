module.exports = {
  apps : [
    {
      name: 'api',
      script: 'server/restlike-api.js',
      cwd: 'server',
    },
    {
      name: 'spider',
      script: 'server/spider.js',
      cwd: 'server',
    },
  ],
};
