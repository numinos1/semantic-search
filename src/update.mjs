import 'dotenv/config';
import postgres from 'postgres';
import OpenAI from 'openai';
import Bookstack from './bookstack.mjs';
import pMap from 'p-map';


const {
  POSTGRES_DB,
  POSTGRES_HOST,
  POSTGRES_PORT,
  POSTGRES_USER,
  POSTGRES_PASSWORD,
  OPENAI_API_KEY,
  BOOKSTACK_HOST,
  BOOKSTACK_TOKEN_ID,
  BOOKSTACK_TOKEN_SECRET
} = process.env;

const sql = postgres({
  host: POSTGRES_HOST,
  port: POSTGRES_PORT,
  database: POSTGRES_DB,
  username: POSTGRES_USER,
  password: POSTGRES_PASSWORD
});

const bookstack = new Bookstack({
  host: BOOKSTACK_HOST,
  tokenId: BOOKSTACK_TOKEN_ID,
  tokenSecret: BOOKSTACK_TOKEN_SECRET
});

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY
});

const results = await updateTables();
await updateContent(results);

// -------------------------------------------------------------
//                    Update Table
// -------------------------------------------------------------

async function updateTable(name, rows) {
  const cols = Object.keys(rows[0]);
  const dbList = await sql`SELECT ${sql(cols)} FROM ${sql(name)}`;
  const dbMap = new Map(dbList.map(row => ([row.id, row])));
  const insert = [];
  const update = [];
  const remove = [];

  rows.forEach(row => {
    const dbRow = dbMap.get(row.id);

    if (!dbRow) {
      insert.push(row);
    } else {
      const dbDate = dbRow.updated_on.getTime();
      const rowDate = new Date(row.updated_on).getTime();

      if (dbDate !== rowDate) {
        update.push(row);
      }
      dbMap.delete(row.id);
    }
  });

  dbMap.forEach(dbRow => {
    remove.push(dbRow);
  });

  if (insert.length) {
    console.log('INSERT', insert.length, name);

    await sql`
      INSERT INTO ${sql(name)} ${sql(insert)}
    `;
  }
  if (update.length) {
    console.log('UPDATE', update.length, name);

    for (let i = 0; i < update.length; i++) {
      const { id, ...rest } = update[i];
      await sql`
        UPDATE ${sql(name)}
        SET ${sql(rest)}
        WHERE id = ${id}
      `;
    }
  }
  if (remove.length) {
    console.log('DELETE', remove.length, name);

    for (let i = 0; i < remove.length; i++) {
      const { id } = remove[i];
      await sql`
        DELETE FROM ${sql(name)}
        WHERE id = ${id}
      `;
    }
  }
  return { insert, update, remove };
}

// -------------------------------------------------------------
//                     Update Tables
// -------------------------------------------------------------

async function updateTables() {
  console.log('UPDATING shelves');
  const shelves = await bookstack.getShelves();
  await updateTable('shelves', shelves.map(row => ({
    id: row.id,
    title: row.name || '',
    tease: row.description || '',
    slug: row.slug || '',
    updated_on: row.updated_at
  })));

  console.log('UPDATING books');
  const books = await bookstack.getBooks();
  await updateTable('books', books.map(row => ({
    id: row.id,
    shelf_id: 0,
    title: row.name || '',
    tease: row.description || '',
    slug: row.slug || '',
    updated_on: row.updated_at || new Date().toISOString()
  })));

  console.log('UPDATING chapters');
  const chapters = await bookstack.getChapters();
  await updateTable('chapters', chapters.map(row => ({
    id: row.id,
    book_id: row.book_id || 0,
    title: row.name || '',
    tease: row.description || '',
    slug: row.slug || '',
    updated_on: row.updated_at || new Date().toISOString()
  })));

  console.log('UPDATING pages');
  const pages = await bookstack.getPages();
  const changes = await updateTable('pages', pages.map(row => ({
    id: row.id,
    chapter_id: row.chapter_id || 0,
    book_id: row.book_id || 0,
    title: row.name || '',
    slug: row.slug || '',
    html: '',
    markdown: '',
    updated_on: row.updated_at || new Date().toISOString()
  })));

  return {
    shelves: toMap(shelves),
    books: toMap(books),
    chapters: toMap(chapters),
    pages: toMap(pages),
    changes
  };
}

/**
 * List to Map
 */
function toMap(list) {
  return list.reduce((map, row) =>
    map.set(row.id, row),
    new Map()
  );
}

// -------------------------------------------------------------
//                   Update Page Content
// -------------------------------------------------------------

function updateContent({ books, chapters, changes }) {
  const pageIds = changes.insert
    .concat(changes.update)
    .map(row => row.id);

  return pMap(pageIds, async (pageId) => {
    const page = await bookstack.getPages(pageId);
    const { name, html, markdown, book_id, chapter_id } = page;
    const book = books.get(book_id);
    const chapter = chapters.get(chapter_id);
    const pageTitle = [
      book?.name?.trim() || '',
      chapter?.name?.trim() || '',
      name?.trim() || ''
    ].filter(val => val).join(' / ');

    const aiResult = await openai.embeddings.create({
      input: pageTitle,
      model: "text-embedding-ada-002"
    });
    const embedding = aiResult.data[0].embedding;

    console.log('CONTENT', pageId, html.length, markdown.length, embedding.length, pageTitle);

    const embeddings = [{
      page_id: pageId,
      text_weight: 100,
      input: pageTitle,
      embedding: JSON.stringify(embedding)
    }];

    await sql`
      UPDATE pages
      SET ${sql({ html, markdown })}
      WHERE id = ${pageId}
    `;
    await sql`
      DELETE FROM embeddings
      WHERE page_id = ${pageId}
    `;
    await sql`
      INSERT INTO embeddings
      ${sql(embeddings)}
    `;
  }, { concurrency: 1 });
}

// ----------------------------------------------------------
//  BookStack Navigation
// ----------------------------------------------------------

// const books = await bookstack.getDirectory();

// books.forEach(book => {
//   console.log(chalk.yellow(book.id), chalk.cyan(book.name));
//   book.chapters.forEach(chapter => {
//     console.log('  ', chalk.yellow(chapter.id), chalk.magenta(chapter.name));
//     chapter.pages.forEach(page => {
//       console.log('    ', chalk.yellow(page.id), page.name, chalk.gray(page.updatedOn));
//     });
//   });
//   book.pages.forEach(page => {
//     console.log('  ', chalk.yellow(page.id), page.name, chalk.gray(page.updatedOn));
//   });
// });

await sql.end();
