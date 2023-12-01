import 'dotenv/config';
import postgres from 'postgres';
import chalk from 'chalk';
import OpenAI from 'openai';

const {
  POSTGRES_DB,
  POSTGRES_HOST,
  POSTGRES_PORT,
  POSTGRES_USER,
  POSTGRES_PASSWORD,
  OPENAI_API_KEY,
} = process.env;

const sql = postgres({
  host: POSTGRES_HOST,
  port: POSTGRES_PORT,
  database: POSTGRES_DB,
  username: POSTGRES_USER,
  password: POSTGRES_PASSWORD
});

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY
});

const search = process.argv[2];

const aiResult = await openai.embeddings.create({
  input: search,
  model: "text-embedding-ada-002"
});
const embedding = aiResult.data[0].embedding;

const results = await sql`
  SELECT id, page_id, input FROM embeddings
  ORDER BY embedding <-> ${JSON.stringify(embedding)}
  LIMIT 5
`;

console.log();
results.forEach((row, index) => {
  console.log(index + 1, '-', chalk.green(row.input));
});
console.log();

await sql.end();
