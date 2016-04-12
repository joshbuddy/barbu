const execSync = require('child_process').execSync;
const config = require("../config/test.json");
const url = require('url');
const dbName = url.parse(config.pg.url).path.substring(1);

execSync(`dropdb --if-exists ${dbName}`);
execSync(`createdb ${dbName}`)
execSync(`psql -d ${dbName} -f init.sql`)

global.truncateTables = function() {
  execSync(`psql -d ${dbName} -c "truncate users; truncate games; truncate game_players;"`);
}

global.getAnswer = function() {
  var out = JSON.parse(execSync(`psql -d ${dbName} -c "select state from games where id = 1" -t`))
  return out.number;
}