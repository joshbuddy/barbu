create table users (
  id serial primary key,
  name varchar(20) NOT NULL,
  password varchar(100) NOT NULL
);
create unique index on users (name);

create table games (
  id serial primary key,
  name varchar(100) NOT NULL,
  state json NOT NULL,
  created_at date default current_date NOT NULL,
  updated_at date default current_date NOT NULL,
  finished boolean default false NOT NULL
);
create index on games (finished);

create table game_players (
  id serial primary key,
  game_id int NOT NULL,
  user_id int NOT NULL,
  position int NOT NULL
);
create index on game_players (user_id);
create index on game_players (game_id);
create unique index on game_players (user_id, game_id, position);
