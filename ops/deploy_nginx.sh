SERVER="maltaa.org"
SERVER_AUTH="deploy@${SERVER}"

scp ops/*.nginx ${SERVER_AUTH}:/tmp/;
ssh -t ${SERVER_AUTH} "sudo cp /tmp/*.nginx /etc/nginx/ && sudo nginx -t && sudo nginx -s reload";
