pm2="node_modules/.bin/pm2"

function cleanup {
  pm2 stop all
}
trap cleanup EXIT

mkdir dev/db
mkdir -p built/server
echo "console.info('maltaa api placeholder')" > built/server/maltaa-api.js
echo "console.info('maltaa spider placeholder')" > built/server/maltaa-spider.js

pm2 stop all
pm2 kill
pm2 flush
pm2 start dev/ecosystem.config.js
pm2 logs
