# To be executed on remote server

npm install;
pm2 stop all;
pm2 start pm2.prod.config.js;

