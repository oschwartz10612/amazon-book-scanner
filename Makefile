include .env
export $(shell sed 's/=.*//' .env)

proxy: 
	./cloud_sql_proxy -dir=${DB_SOCKET_PATH} --instances=${CLOUD_SQL_CONNECTION_NAME} --credential_file=${GOOGLE_APPLICATION_CREDENTIALS}

build:
	gcloud builds submit --tag gcr.io/${PROJECT_ID}/amazon_api

deploy:
	gcloud run deploy --image gcr.io/${PROJECT_ID}/amazon_api --platform managed \
	--set-env-vars SELLING_PARTNER_APP_CLIENT_ID="${SELLING_PARTNER_APP_CLIENT_ID}" \
	--set-env-vars SELLING_PARTNER_APP_CLIENT_SECRET="${SELLING_PARTNER_APP_CLIENT_SECRET}" \
	--set-env-vars AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID}" \
	--set-env-vars AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY}" \
	--set-env-vars AWS_SELLING_PARTNER_ROLE="${AWS_SELLING_PARTNER_ROLE}" \
	--set-env-vars REFRESH_TOKEN="${REFRESH_TOKEN}" \
	--set-env-vars MARKET_ID="${MARKET_ID}" \
	--set-env-vars CLOUD_SQL_CONNECTION_NAME="${CLOUD_SQL_CONNECTION_NAME}" \
	--set-env-vars MYSQL_USER="${MYSQL_USER}" \
	--set-env-vars MYSQL_PASS="${MYSQL_PASS}" \
	--set-env-vars MYSQL_DATABASE="${MYSQL_DATABASE}" \
  	--add-cloudsql-instances "${CLOUD_SQL_CONNECTION_NAME}"