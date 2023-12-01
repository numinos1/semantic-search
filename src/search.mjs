import 'dotenv/config';
import chalk from 'chalk';
import Database from './services/database.mjs';
import OpenAI from './services/openai.mjs';

const db = new Database({
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  database: process.env.POSTGRES_DB,
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD
});

const ai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const search = process.argv[2];
const embedding = await ai.embed(search);
const results = await db.queryEmbeddings(embedding);

console.log();
results.forEach((row, index) => {
  console.log(index + 1, '-', chalk.green(row.input));
});
console.log();

await db.terminate();
