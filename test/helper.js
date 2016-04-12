const execSync = require('child_process').execSync;
const config = require("../config/test.json");
const url = require('url');
const parsedUrl = url.parse(config.pg.url);
const dbName = parsedUrl.path.substring(1);
const user = parsedUrl.auth || process.env.USER;

execSync(`dropdb --if-exists ${dbName} -U ${user}`);
execSync(`createdb ${dbName} -U ${user}`)
execSync(`psql -d ${dbName} -f init.sql -U ${user}`)

global.truncateTables = function() {
  execSync(`psql -d ${dbName} -c "truncate users; truncate games; truncate game_players;"  -U ${user}`);
}

global.getAnswer = function() {
  var out = JSON.parse(execSync(`psql -d ${dbName} -c "select state from games where id = 1" -t -U ${user}`))
  return out.number;
}