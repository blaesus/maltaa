rsync -avz  -e "ssh -p 233" built/dist/ deploy@narita:/var/maltaa
ssh -p 233 deploy@narita "cd /var/maltaa && sh update_app.sh"
