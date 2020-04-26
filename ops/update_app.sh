# To be executed on remote server

npm install;
pm2 stop all;
node server/server/migrate.js
pm2 start pm2.prod.config.js --update-env;
