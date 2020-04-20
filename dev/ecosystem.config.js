module.exports = {
  apps : [
    {
      name: 'tsc',
      script: 'node_modules/.bin/tsc',
      args: "--watch",
      cwd: '.',
    },
    {
      name: 'dev-server',
      script: 'node_modules/.bin/webpack-dev-server --config src/client/web/webpack.config.js',
      args: "",
      cwd: '.',
    },
    {
      name: 'nginx',
      script: "nginx",
      args: `-p ${process.cwd()} -c ${process.cwd()}/dev/dev.nginx`,
      cwd: '.',
    },
    {
      name: 'mongo',
      script: "mongod",
      args: `--dbpath dev/db`,
      cwd: '.',
    },
    {
      name: 'maltaa-api',
      script: 'server/restlike-api.js',
      cwd: 'built',

      autorestart: true,
      watch: `${process.cwd()}`,
      max_memory_restart: '1G',
    },
    {
      name: 'spider',
      script: 'server/spider.js',
      cwd: 'built',

      autorestart: true,
      // watch: `${__dirname}/../built/server`,
      watch: false,
      max_memory_restart: '1G',
    },

  ],
};

console.info(module.exports)
