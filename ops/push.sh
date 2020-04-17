rsync -avz  -e "ssh -p 233" built/dist/ deploy@maltaa.org:/var/maltaa
ssh -p 233 deploy@maltaa.org "cd /var/maltaa && sh update_app.sh"
