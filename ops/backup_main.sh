# To be executed on remote server

FILENAME="sync-$(date +%Y%m%d-%H%M).gz"

echo "Dumping sync database to ${FILENAME}"
mongodump --host=localhost --db=maltaaMattersSync --gzip --archive=/var/maltaa_backups/"${FILENAME}"