SERVER="maltaa.org"
SERVER_AUTH="deploy@${SERVER}"

scp -P 233 ops/*.nginx ${SERVER_AUTH}:/tmp/;
ssh -p 233 -t ${SERVER_AUTH} "sudo cp /tmp/*.nginx /etc/nginx/ && sudo nginx -t && sudo nginx -s reload";
