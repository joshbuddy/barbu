drop table users;
drop table games;
drop table game_players;
drop table game_data;

create table if not exists users (
  id serial primary key,
  name varchar(20) NOT NULL,
  password varchar(20) NOT NULL
);
create index on users (name);

create table if not exists games (
  id serial primary key,
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

create table if not exists game_data (
  id serial primary key,
  game_id int NOT NULL,
  value json NOT NULL
);
create index on game_data (game_id);

insert into users (name, password) VALUES ('josh', 'rasputin');
insert into users (name, password) VALUES ('ella', 'rasputin');
insert into users (name, password) VALUES ('eric', 'rasputin');
insert into users (name, password) VALUES ('jenny', 'rasputin');
