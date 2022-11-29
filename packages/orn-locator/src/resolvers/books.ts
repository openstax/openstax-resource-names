import memoize from 'lodash/fp/memoize';
import { isResourceOrContentOfTypeFilter, locateAll } from '..';
import { fetch } from '../utils/browsersafe-fetch';

const oswebUrl = 'https://openstax.org/apps/cms/api/v2/pages';
const fields = 'cnx_id,authors,publish_date,cover_color,amazon_link,book_state,promote_image,webview_rex_link,cover_url,title_image_url';

const getReleaseJson = memoize(async () => {
  return fetch('https://openstax.org/rex/release.json')
    .then(response => response.json())
  ;
});
const getArchiveInfo = memoize(async (bookId: string) => {
  const releaseJson = await getReleaseJson();
  const bookConfig = releaseJson.books[bookId];

  return {
    archivePath: bookConfig.archiveOverride || releaseJson.archiveUrl,
    bookVersion: bookConfig.defaultVersion,
  };
});

export const library = async(language: string) => {
  const releaseJson = await getReleaseJson();

  return {
    id: 'library',
    orn: 'https://openstax.org/orn/library',
    type: 'library' as const,
    title: 'OpenStax Textbooks',
    urls: {
      main: 'https://openstax.org/subjects'
    },
    contents: (await Promise.all(
      Object.entries(releaseJson.books)
        .filter(([, config]: [any, any]) => config.retired !== true)
        .map(([id]) => book(id))
    ))
      .filter(book =>
        (language === 'all' || book.language === language)
        && book.state === 'live'
      ),
  };
};

const commonBook = memoize(async(id: string) => {
  const oswebData = await fetch(`${oswebUrl}?type=books.Book&fields=${fields}&cnx_id=${id}`)
    .then(response => response.json() as any)
    .then(data => data.items[0])
  ;

  const {archivePath, bookVersion} = await getArchiveInfo(id);
  const archiveUrl = `https://openstax.org${archivePath}/contents/${id}@${bookVersion}.json`;
  const archiveData = await fetch(archiveUrl)
    .then(response => response.json());

  const default_page_slug = oswebData.webview_rex_link.match(/\/books\/.*\/pages\/(.*)$/)?.[1] as string;
  const default_page = default_page_slug && findTreeNodeBySlug(default_page_slug, archiveData.tree);

  return {
    oswebData,
    archiveData,
    book: {
      id,
      orn: `https://openstax.org/orn/book/${id}`,
      type: 'book' as const,
      state: oswebData.book_state as string,
      title: oswebData.title as string,
      language: archiveData.language as string,
      slug: oswebData.meta.slug as string,
      default_page: default_page ? mapTree(id)(default_page) : undefined,
      theme: oswebData.cover_color as string,
      urls: {
        main: oswebData.meta.html_url as string,
        information: oswebData.meta.html_url as string,
        experience: oswebData.webview_rex_link as string,
      },
      images: {
        main: oswebData.cover_url as string,
        square: oswebData.cover_url as string,
        wide: oswebData.title_image_url as string,
        promotional: oswebData.promote_image?.meta.download_url as string | undefined,
      }
    }
  };
});

export const book = async(id: string) => {
  return (await commonBook(id)).book;
};

type TreePageElement = {id: string; title: string; orn: string; type: 'book:page'; slug: string};
type TreeElement = TreePageElement
  | {id: string; title: string; orn: string; type: 'book:subbook'; contents: TreeElement[]; default_page: undefined | TreePageElement};

const mapTree = (bookId: string) => (tree: any): TreeElement => {
  if (tree.contents) {
    const subTreeId = tree.id.split('@')[0];
    const default_page = findTreeNode(t => !('contents' in t), tree);
    return {
      id: subTreeId,
      title: tree.title,
      default_page: default_page ? mapTree(bookId)(default_page) as TreePageElement : undefined,
      contents: tree.contents.map(mapTree(bookId)),
      orn: `https://openstax.org/orn/book:subbook/${bookId}:${subTreeId}`,
      type: 'book:subbook',
    };
  } else {
    const pageId = tree.id.split('@')[0];
    return {
      id: pageId,
      title: tree.title,
      orn: `https://openstax.org/orn/book:page/${bookId}:${pageId}`,
      slug: tree.slug,
      type: 'book:page'
    };
  }
};

const findTreeNodeBySlug = (slug: string, tree: any): any => {
  return findTreeNode(search => search.slug === slug, tree);
};

const findTreeNodeById = (id: string, tree: any): any => {
  return findTreeNode(search => search.id.split('@')[0] === id, tree);
};

const findTreeNode = (predicate: (tree: any) => boolean, tree: any): any => {
  if (predicate(tree)) {
    return tree;
  }

  for (const node of (tree.contents || [])) {
    const result = findTreeNode(predicate, node);
    if (result) {
      return result;
    }
  }
};

export const bookDetail = memoize(async(id: string) => {
  const {archiveData, book} = await commonBook(id);

  return {
    ...book,
    contents: (archiveData.tree.contents as any[]).map(mapTree(id)),
  };
});

export const subbook = async({bookId, subbookId}: {bookId: string; subbookId: string}) => {
  const bookData = await book(bookId);
  const {archivePath, bookVersion} = await getArchiveInfo(bookId);
  const archiveUrl = `https://openstax.org${archivePath}/contents/${bookId}@${bookVersion}.json`;
  const archiveData = await fetch(archiveUrl)
    .then(response => response.json())
  ;

  const tree = findTreeNodeById(subbookId, archiveData.tree);
  const default_page = findTreeNode(t => !('contents' in t), tree);

  return {
    id: subbookId,
    title: tree.title as string,
    book: bookData,
    default_page: default_page ? mapTree(bookId)(default_page) : undefined,
    contents: (tree.contents as any[]).map(mapTree(bookId)),
    orn: `https://openstax.org/orn/book:subbook/${bookId}:${subbookId}`,
    type: 'book:subbook' as const,
  };
};


export const page = async({bookId, pageId}: {bookId: string; pageId: string}) => {
  const bookData = await book(bookId);

  const {archivePath, bookVersion} = await getArchiveInfo(bookId);
  const archiveUrl = `https://openstax.org${archivePath}/contents/${bookId}@${bookVersion}:${pageId}.json`;
  const archiveData = await fetch(archiveUrl)
    .then(response => response.json())
  ;

  const rexUrl = `https://openstax.org/books/${bookData.slug}/pages/${archiveData.slug}`;

  return {
    orn: `https://openstax.org/orn/book:page/${bookId}:${pageId}`,
    id: pageId,
    type: 'book:page' as const,
    title: archiveData.title as string,
    contextTitle: `${bookData.title} / ${archiveData.title}`,
    book: bookData,
    slug: archiveData.slug as string,
    urls: {
      main: rexUrl as string,
      experience: rexUrl as string
    }
  };
};

export const element = async({bookId, pageId, elementId}: {bookId: string; pageId: string; elementId: string}) => {
  const pageData = await page({bookId, pageId});

  const url = `${pageData.urls.experience}#${elementId}`;

  return {
    orn: `https://openstax.org/orn/book:page:element/${bookId}:${pageId}:${elementId}`,
    id: elementId,
    type: 'book:page:element' as const,
    page: pageData,
    urls: {
      main: url,
      experience: url
    }
  };
};

const memoryTreeSearch = (getRank: (node: any) => number) => (node: any): Array<{node: any; rank: number}> => {
  const rank = getRank(node);
  const contents = ('contents' in node ? node.contents.map(memoryTreeSearch(getRank)) : [])
    .reduce((result: any[], item: any[]) => [...result, ...item], []);

  return rank > 0 ? [{node, rank}, ...contents] : contents;
};
export const bookSearch = async(query: string, filters: {[key: string]: string | string[]} = {}): Promise<Awaited<ReturnType<typeof book>>[]> => {
  const scopes = 'scope' in filters
    ? (await locateAll(typeof filters.scope === 'string' ? [filters.scope] : filters.scope))
      .filter(isResourceOrContentOfTypeFilter(['library']))
    : [await library('all')];

  return doSearch(query, ['book'])(scopes);
};
export const pageSearch = async(query: string, filters: {[key: string]: string | string[]} = {}): Promise<Awaited<ReturnType<typeof page>>[]> => {
  const scopes = 'scope' in filters
    ? (await locateAll(typeof filters.scope === 'string' ? [filters.scope] : filters.scope))
      .filter(isResourceOrContentOfTypeFilter(['book'])).map(book => book.id)
    : (await library('all')).contents.map(book => book.id);

  return await Promise.all(scopes.map(bookDetail))
    .then(doSearch(query, ['book:page']))
  ;
};

const doSearch = (query: string, filterTypes: string[]) => (inputs: any[]): Promise<any[]> => {
  const results = inputs.map(memoryTreeSearch(parseSearchQuery(query, filterTypes)))
    .reduce((result, item) => [...result, ...item], []);

  results.sort((a, b) => b.rank - a.rank);
  return locateAll(
    results
      .slice(0, 5)
      .map(result => result.node.orn)
  );
};
const parseSearchQuery = (query: string, filterTypes: string[]) => {
  const quotedTerms = [...query.matchAll(/"(.+)"/g)].map(match => match[1]);
  const commaSeparatedPhrases = [...query.replace('"', '').matchAll(/([^,]+)/g)].map(match => match[1]);
  const words = [...query.replace('"', '').matchAll(/([^ ]+)/g)].map(match => match[1]);

  const getRank = (node: any) => {
    const text = 'title' in node ? node.title : '';
    let rank = 0;

    if (!filterTypes.includes(node.type)) {
      return rank;
    }

    rank += (5 * quotedTerms.reduce((result, term) =>
      result + [...text.matchAll(new RegExp(term, 'ig'))].length, 0
    ));
    rank += (3 * commaSeparatedPhrases.reduce((result, term) =>
      result + [...text.replace(/[,"]/g, '').matchAll(new RegExp(term, 'ig'))].length, 0
    ));
    rank += words.reduce((result, term) =>
      result + [...text.replace(/[,"]/g, '').matchAll(new RegExp(term, 'ig'))].length, 0
    );

    return rank;
  };

  return getRank;
};
