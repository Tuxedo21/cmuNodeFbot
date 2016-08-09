module.exports = {
	DB_CONFIG: {
		client: 'pg',
		connection: process.env.PG_CONNECTION_STRING,
		debug: true
	}
}