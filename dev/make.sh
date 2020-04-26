BUILD_ROOT="built/dist"
tsc=node_modules/.bin/tsc
webpack=node_modules/.bin/webpack

rm -rf ${BUILD_ROOT}
mkdir -p ${BUILD_ROOT}

${tsc} --project tsconfig.prod.server.json
${webpack} --config src/client/web/webpack.config.prod.js

cp ops/pm2.prod.config.js ${BUILD_ROOT}/
cp ops/update_app.sh ${BUILD_ROOT}/
cp ops/backup*.sh ${BUILD_ROOT}/
cp package.json ${BUILD_ROOT}/
cp package-lock.json ${BUILD_ROOT}/
