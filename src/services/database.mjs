import postgres from 'postgres';

/**
 * Database Service
 */
export default class Database {

  /**
   * Constructor
   */
  constructor() {
    this.sql = postgres({
      host: opts.host,
      port: opts.port,
      database: opts.database,
      username: opts.username,
      password: opts.password
    });
  }

  /**
   * Terminate Db Connection
   */
  terminate() {
    return this.sql.end();
  }

  /**
   * Update Table
   */
  async updateTable(name, rows) {
    const cols = Object.keys(rows[0]);
    const dbList = await this.sql`SELECT ${this.sql(cols)} FROM ${this.sql(name)}`;
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

      await this.sql`
        INSERT INTO ${this.sql(name)} ${this.sql(insert)}
      `;
    }
    if (update.length) {
      console.log('UPDATE', update.length, name);

      for (let i = 0; i < update.length; i++) {
        const { id, ...rest } = update[i];
        await this.sql`
          UPDATE ${this.sql(name)}
          SET ${this.sql(rest)}
          WHERE id = ${id}
        `;
      }
    }
    if (remove.length) {
      console.log('DELETE', remove.length, name);

      for (let i = 0; i < remove.length; i++) {
        const { id } = remove[i];
        await this.sql`
          DELETE FROM ${this.sql(name)}
          WHERE id = ${id}
        `;
      }
    }
    return { insert, update, remove };
  }

  /**
   * Update Shelves
   */
  updateShelves(rows) {
    return this.updateTable(
      'shelves',
      rows.map(row => ({
        id: row.id,
        title: row.name || '',
        tease: row.description || '',
        slug: row.slug || '',
        updated_on: row.updated_at
      }))
    );
  }

  /**
   * Update Books
   */
  updateBooks(rows) {
    return this.updateTable(
      'books',
      rows.map(row => ({
        id: row.id,
        shelf_id: 0,
        title: row.name || '',
        tease: row.description || '',
        slug: row.slug || '',
        updated_on: row.updated_at
      }))
    );
  }

  /**
   * Update Chapters
   */
  updateChapters(rows) {
    return this.updateTable(
      'chapters',
      rows.map(row => ({
        id: row.id,
        book_id: row.book_id || 0,
        title: row.name || '',
        tease: row.description || '',
        slug: row.slug || '',
        updated_on: row.updated_at
      }))
    );
  }

  /**
   * Update Pages
   */
  updatePages(rows) {
    return this.updateTable(
      'pages',
      rows.map(row => ({
        id: row.id,
        chapter_id: row.chapter_id || 0,
        book_id: row.book_id || 0,
        title: row.name || '',
        slug: row.slug || '',
        html: '',
        markdown: '',
        updated_on: row.updated_at
      }))
    );
  }

  /**
   * Update Page Content
   */
  updateContent(pageId, html, markdown) {
    return this.sql`
      UPDATE pages
      SET ${sql({ html, markdown })}
      WHERE id = ${pageId}
    `;
  }

  /**
   * Update Embeddings
   */
  async updateEmbeddings(pageId, embeddings) {
    await this.sql`
      DELETE FROM embeddings
      WHERE page_id = ${pageId}
    `;
    await this.sql`
      INSERT INTO embeddings
      ${sql(JSON.stringify(embeddings))}
    `;
  }

  /**
   * Query Embeddings
   */
  queryEmbeddings(embedding, limit = 5) {
    return this.sql`
      SELECT id, page_id, input FROM embeddings
      ORDER BY embedding <-> ${JSON.stringify(embedding)}
      LIMIT ${limit}
    `;
  }
}
