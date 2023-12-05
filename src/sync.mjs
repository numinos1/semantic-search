import 'dotenv/config';
import Bookstack from './services/bookstack.mjs';
import Database from './services/database.mjs';
import OpenAI from './services/openai.mjs';
import toMap from './utils/to-map.mjs';

const db = new Database({
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  database: process.env.POSTGRES_DB,
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD
});

const docs = new Bookstack({
  host: process.env.BOOKSTACK_HOST,
  tokenId: process.env.BOOKSTACK_TOKEN_ID,
  tokenSecret: process.env.BOOKSTACK_TOKEN_SECRET
});

const ai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

console.log('UPDATING shelves');

const shelves = await docs.getShelves();
await db.updateShelves(shelves);

console.log('UPDATING books');

const books = await docs.getBooks();
const booksMap = toMap(books);
await db.updateBooks(books);

console.log('UPDATING chapters');

const chapters = await docs.getChapters();
const chaptersMap = toMap(chapters);
await db.updateChapters(chapters);

console.log('UPDATING pages');

const pages = await docs.getPages();
const pageChanges = await db.updatePages(pages);

console.log('UPDATING embeddings');

const pageIds = pageChanges.insert
  .concat(pageChanges.update)
  .map(row => row.id);

for (let i = 0; i < pageIds.length; i++) {
  const pageId = pageIds[i];
  const page = await docs.getPages(pageId);
  const { name, html, markdown, book_id, chapter_id } = page;
  const book = booksMap.get(book_id);
  const chapter = chaptersMap.get(chapter_id);

  const pageTitle = [
    book?.name?.trim() || '',
    chapter?.name?.trim() || '',
    name?.trim() || ''
  ].filter(val => val).join(' / ');

  console.log('CONTENT', pageId, pageTitle);

  const embedding = await ai.embed(pageTitle);

  await db.updateContent(pageId, html, markdown);

  await db.updateEmbeddings(pageId, [{
    page_id: pageId,
    text_weight: 100,
    input: pageTitle,
    embedding: JSON.stringify(embedding)
  }]);
}

await db.terminate();
