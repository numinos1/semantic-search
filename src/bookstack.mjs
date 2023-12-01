import axios from 'axios';

/**
 * Bookstack Class
 */
export default class Bookstack {

  /**
   * Constructor
   */
  constructor({ host, tokenId, tokenSecret}) {
    this.api = axios.create({
      baseURL: host,
      timeout: 10000,
      headers: {
        Authorization: `Token ${tokenId}:${tokenSecret}`
      }
    });
  }

  /**
   * Get Results
   * @private
   */
  async _get(url, params = {}) {
    const result = await this.api.get(url, { params });
    return result.data;
  }

  /**
   * Paginate through query results
   * @private
   */
  async _getAll(url) {
    const count = 100;
    let list = [];
    let length = 0;
    let offset = 0;

    do {
      const { total, data } = await this._get(url, {
        count,
        offset
      });

      length = total;
      list = list.concat(data);
      offset += data.length;

    } while (offset < length)

    return list;
  }

  /**
   * Get Shelves
   * @public
   */
  getShelves(id) {
    return id
      ? this._get(`shelves/${id}`)
      : this._getAll('shelves');
  }

  /**
   * Get Books
   * @public
   */
  getBooks(id) {
    return id
      ? this._get(`books/${id}`)
      : this._getAll('books');
  }

  /**
   * Get Chapters
   * @public
   */
  getChapters(id) {
    return id
      ? this._get(`/chapters/${id}`)
      : this._getAll('/chapters');
  }

  /**
   * Get Pages
   *
  */
  getPages(id) {
    return id
      ? this._get(`/pages/${id}`)
      : this._getAll('/pages');
  }

  /**
   * Get Directory
   */
  async getDirectory() {
    const [books, chapters, pages] = await Promise.all([
      this.getBooks(),
      this.getChapters(),
      this.getPages()
    ]);
    const bookMap = new Map();

    books.forEach((book) => {
      bookMap
        .set(book.id, {
          id: book.id,
          name: book.name,
          description: book.description,
          updatedOn: book.updated_at,
          chapters: new Map(),
          pages: new Map()
        });
    });

    chapters.forEach((chapter) => {
      bookMap
        .get(chapter.book_id).chapters
        .set(chapter.id, {
          id: chapter.id,
          name: chapter.name,
          description: chapter.description,
          updatedOn: chapter.updated_at,
          pages: new Map()
        });
    });

    pages.forEach(page => {
      const book = bookMap.get(page.book_id);
      const node = page.chapter_id
        ? book.chapters.get(page.chapter_id).pages
        : book.pages;

      node.set(page.id, {
        id: page.id,
        name: page.name,
        updatedOn: page.updated_at
      });
    });

    return bookMap;
  }
}
