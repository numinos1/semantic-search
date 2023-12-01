CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS shelves (
  id integer PRIMARY KEY,
  title text,
  slug varchar(256),
  tease varchar(256),
  updated_on timestamptz
);

CREATE TABLE IF NOT EXISTS books (
  id integer PRIMARY KEY,
  shelf_id integer,
  title text,
  tease varchar(256),
  slug varchar(256),
  updated_on timestamptz
);

CREATE TABLE IF NOT EXISTS chapters (
  id integer PRIMARY KEY,
  book_id integer,
  title text,
  tease varchar(256),
  slug varchar(256),
  updated_on timestamptz
);

CREATE TABLE IF NOT EXISTS pages (
  id integer PRIMARY KEY,
  chapter_id integer,
  book_id integer,
  title text,
  slug varchar(256),
  html text,
  markdown text,
  updated_on timestamptz
);

CREATE TABLE IF NOT EXISTS embeddings (
  id SERIAL PRIMARY KEY,
  page_id integer,
  text_weight integer,
  input text,
  embedding vector
);
