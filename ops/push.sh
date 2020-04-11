rsync -avz built/dist/ deploy@maltaa.org:/var/maltaa
ssh deploy@maltaa.org "cd /var/maltaa && sh update_app.sh"
