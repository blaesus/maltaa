# To be executed on remote server

pm2 stop all;
npm install;
pm2 start pm2.prod.config.js;

