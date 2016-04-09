drop table users;
drop table games;
drop table game_players;

create table if not exists users (
  id serial primary key,
  name varchar(20) NOT NULL,
  password varchar(100) NOT NULL
);
create unique index on users (name);

create table if not exists games (
  id serial primary key,
  state json NOT NULL,
  finished boolean default TRUE NOT NULL
);
create index on games (finished);

create table if not exists game_players (
  id serial primary key,
  game_id int NOT NULL,
  user_id int NOT NULL,
  position int NOT NULL
);
create index on game_players (user_id);
create index on game_players (game_id);
create unique index on game_players (user_id, game_id, position);
