rsync -avz  -e "ssh -p 222" built/dist/ deploy@yokota:/var/maltaa
ssh -p 222 deploy@yokota "cd /var/maltaa && sh update_app.sh"
