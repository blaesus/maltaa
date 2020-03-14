console.info("****")
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
      script: 'node_modules/.bin/webpack-dev-server',
      args: "",
      cwd: 'src/client',
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
      name: 'malta-api',
      script: 'server/malta-api.js',
      cwd: 'built',

      instances: 1,
      autorestart: true,
      watch: true,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      }
    },
  ],
};
