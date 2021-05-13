env:
	export $(egrep -v '^#' .env | xargs)

proxy: 
	./cloud_sql_proxy -dir=${DB_SOCKET_PATH} --instances=${CLOUD_SQL_CONNECTION_NAME} --credential_file=${GOOGLE_APPLICATION_CREDENTIALS}