var pg = require('pg');
var DATABASE_URL = "postgres://dfrqzoxafxknjp:2rx0YsJnpCKLWAD1szhfuO9EDj@ec2-54-83-31-65.compute-1.amazonaws.com:5432/deb4jrq3k79e6l"

pg.defaults.ssl = true;
pg.connect(process.env.DATABASE_URL, function(err, client) {
  if (err) throw err;
  console.log('Connected to postgres! Getting schemas...');

  client
    .query('SELECT table_schema,table_name FROM information_schema.tables;')
    .on('row', function(row) {
      console.log(JSON.stringify(row));
    });
});
