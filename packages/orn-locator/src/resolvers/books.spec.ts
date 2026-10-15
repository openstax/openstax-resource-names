import type { SearchClient } from '../types/searchClient';
import { book, bookSearch } from './books';

const releaseJson = {
  id: 'release1',
  archiveUrl: '/apps/archive/20240101.000000',
  books: {
    'live-book': { defaultVersion: 'abc123' },
    // retired in REX even though osweb may say otherwise, and vice versa
    'retired-book': { defaultVersion: 'def456', retired: true },
  },
};

const oswebBook = (id: string, bookState: string) => ({
  cnx_id: id,
  title: `Title ${id}`,
  book_state: bookState,
  cover_color: 'blue',
  cover_url: 'cover',
  title_image_url: 'title-image',
  webview_rex_link: `https://openstax.org/books/${id}/pages/preface`,
  meta: { slug: id, html_url: `https://openstax.org/details/books/${id}` },
});

const archiveBook = {
  language: 'en',
  license: { name: 'CC BY', url: 'https://creativecommons.org/licenses/by/4.0/' },
  tree: { id: 'tree@1', title: 'Tree', contents: [] },
};

let originalFetch: typeof global.fetch;

beforeAll(() => {
  originalFetch = global.fetch;
  global.fetch = jest.fn().mockImplementation((url: string) => {
    const body = url.endsWith('/rex/release.json')
      ? releaseJson
      : url.includes('/apps/cms/api/v2/pages')
        // osweb marks the live REX book as retired to show that its state is ignored
        ? { items: [oswebBook(new URL(url).searchParams.get('cnx_id')!, 'retired')] }
        : archiveBook;

    return Promise.resolve(new Response(JSON.stringify(body)));
  });
});

afterAll(() => {
  global.fetch = originalFetch;
});

describe('book', () => {
  it('is not retired when release.json does not retire it, regardless of osweb state', async() => {
    const result = await book('live-book');
    expect(result.state).toBe('retired');
    expect(result.retired).toBe(false);
  });

  it('is retired when release.json retires it', async() => {
    expect((await book('retired-book')).retired).toBe(true);
  });
});

describe('bookSearch', () => {
  const searchClient = (ids: string[]): SearchClient => ({
    search: jest.fn().mockResolvedValue({
      hits: { hits: ids.map(id => ({ index: 'index', source: { id, type: 'book' } })) },
    }),
  } as unknown as SearchClient);

  it('sets retired on cached results from the current release', async() => {
    const results = await bookSearch(searchClient(['live-book', 'retired-book', 'unknown-book']), 'query', 5);

    expect(results.map(({ id, retired }) => ({ id, retired }))).toEqual([
      { id: 'live-book', retired: false },
      { id: 'retired-book', retired: true },
      { id: 'unknown-book', retired: false },
    ]);
  });
});
