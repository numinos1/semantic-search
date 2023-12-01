# Wednesday - November 29, 2023 (FedEx Day AI Project)

## Bootstrap the Project

1. Create .env file with the following information

```conf
POSTGRES_DB=<database-name>
POSTGRES_HOST=<database-host>
POSTGRES_PORT=<database-port>
POSTGRES_USER=<postgres-user>
POSTGRES_PASSWORD=<postgres-password>
OPENAI_API_KEY=<openai-token>
BOOKSTACK_TOKEN_ID=<bookstack-token-id>
BOOKSTACK_TOKEN_SECRET=<bookstack-token-secret>
BOOKSTACK_HOST=<bookstack-host-uri>
```

2. Create the Postgres data directory

```bash
mkdir data
```

2. Start the Postgres Docker instance

```bash
docker-compose up -d
```

3. Postgres Docker "exec" Terminal Client

```bash
psql --username=testuser --password bookstack
  testpwd
```

Here are some useful Postgres commands to get started:

| command | description |
| - | - |
| \dt | List all the tables in the database |
| \d pages | Show the pages table schema |

## BookStack Data Structures

- API Docs: https://demo.bookstackapp.com/api/docs

```js
const shelves = {
  id: 11,
  name: 'Contact Syncing',
  slug: 'contact-syncing',
  description: '',
  created_at: '2023-11-13T23:41:20.000000Z',
  updated_at: '2023-11-13T23:41:20.000000Z',
  created_by: 25,
  updated_by: 25,
  owned_by: 25
};

const books = {
  id: 31,
  name: 'Vortex Platform Team',
  slug: 'vortex-platform-team',
  description: 'General team info, project overviews, business rules and best practices.',
  created_at: '2023-08-07T22:35:07.000000Z',
  updated_at: '2023-09-25T17:29:45.000000Z',
  created_by: 39,
  updated_by: 10,
  owned_by: 39
};

const chapters = {
  id: 34,
  book_id: 33,
  slug: 'super-admin',
  name: 'Super Admin',
  description: 'Administrative business rules for the fullfilment team.',
  priority: 8,
  created_at: '2023-10-30T20:13:21.000000Z',
  updated_at: '2023-10-30T20:13:21.000000Z',
  created_by: 29,
  updated_by: 29,
  owned_by: 29,
  book_slug: 'storyy-business-rules'
};

const pages = {
    id: 119,
    book_id: 22,
    chapter_id: 14,
    name: 'devnetwork2',
    slug: 'devnetwork2',
    priority: 21,
    created_at: '2023-02-23T17:31:27.000000Z',
    updated_at: '2023-03-30T17:35:29.000000Z',
    created_by: 11,
    updated_by: 11,
    draft: false,
    revision_count: 2,
    template: false,
    owned_by: 11,
    editor: 'markdown',
    book_slug: 'alerts-and-background-info'
  };
```

## OpenAI Notes

- [Code Embeddings](https://openai.com/blog/introducing-text-and-code-embeddings)
- [Use Cases](https://platform.openai.com/docs/guides/embeddings/use-cases)

- 1000 tokens = $0.0004
- A page of text is roughly 800 tokens
- Roughly 3,000 pages for $1.00

## Vector Database Resources

- [Chroma (local service)](https://docs.trychroma.com/)
- [Vectra (local files)](https://github.com/Stevenic/vectra)
- [Qdrant (local service)](https://qdrant.tech/)
- [IMVectorDb (in-memory)](https://github.com/golbin/imvectordb)
- [LanceDb (rust)](https://lancedb.com/)

## Postgress PgVector Resources

- [Docker Postress](https://github.com/felipewom/docker-compose-postgres)
- [Docker PGVector](https://medium.com/@johannes.ocean/setting-up-a-postgres-database-with-the-pgvector-extension-10ab7ff212cc)
- [PGVector Docs](https://github.com/pgvector/pgvector#docker)
