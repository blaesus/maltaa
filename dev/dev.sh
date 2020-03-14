pm2="node_modules/.bin/pm2"

function cleanup {
  pm2 stop all
}
trap cleanup EXIT

mkdir dev/db
mkdir -p built/server
echo "console.info('placeholder')" > server/malta-api.js
pm2 start dev/ecosystem.config.js
pm2 logs
