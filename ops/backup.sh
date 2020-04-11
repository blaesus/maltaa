# To be executed on remote server

FILENAME="$(date +%Y%m%d-%H%M).gz"

echo "Dumping database to ${FILENAME}"
mongodump --host=localhost --db=maltaa --gzip --archive=/var/maltaa_backups/"${FILENAME}"