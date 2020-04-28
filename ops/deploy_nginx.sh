SERVER="yokota"
SERVER_AUTH="deploy@${SERVER}"

scp -P 222 ops/*.nginx ${SERVER_AUTH}:/tmp/;
ssh -p 222 -t ${SERVER_AUTH} "sudo cp /tmp/*.nginx /etc/nginx/ && sudo nginx -t && sudo nginx -s reload";
