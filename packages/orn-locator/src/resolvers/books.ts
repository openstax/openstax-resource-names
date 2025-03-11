// spell-checker: ignore subbook browsersafe osweb
import { SearchResultHitSourceElement } from '@openstax/open-search-client';
import { memoize, } from '@openstax/ts-utils';
import { assertInstanceOf } from '@openstax/ts-utils/assertions';
import { isPlainObject } from '@openstax/ts-utils/guards';
import fetch from 'cross-fetch';
import asyncPool from 'tiny-async-pool/lib/es6';
import { locateAll, LocateAllOptions } from '../resolve';
import type { SearchClient } from '../types/searchClient';
import { acceptResponse } from '../utils/acceptResponse';
import { TitleParts, titleSplit } from '../utils/browsersafe-title-split';

const oswebUrl = 'https://openstax.org/apps/cms/api/v2/pages';
const fields = 'cnx_id,authors,publish_date,cover_color,amazon_link,book_state,book_subjects,book_categories,promote_image,webview_rex_link,cover_url,title_image_url';

const preloadedData = (file: string) => import('../data/' + file);

export const getReleaseJson = memoize(async () => preloadedData('release.json').catch(() => {
  return fetch('https://openstax.org/rex/release.json')
    .then(response => acceptResponse(response))
    .then(response => response.json())
  ;
}));

export const getArchiveInfo = memoize(async (bookId: string, bookContentVersion?: string, bookArchiveVersion?: string) => {
  const archivePath = bookArchiveVersion ? `/apps/archive/${bookArchiveVersion}` : null;

  if (archivePath && bookContentVersion) {
    return { archivePath, bookVersion: bookContentVersion };
  }

  const releaseJson = await getReleaseJson();
  const bookConfig = releaseJson.books[bookId];

  return {
    archivePath: archivePath || bookConfig.archiveOverride || releaseJson.archiveUrl,
    bookVersion: bookContentVersion || bookConfig.defaultVersion,
  };
});

const getReleaseId = async () => {
  const releaseJson = await getReleaseJson();
  return releaseJson.id;
};

const getBookIds = async () => {
  const releaseJson = await getReleaseJson();
  return Object.entries(releaseJson.books)
    .filter(([, config]: [any, any]) => config.retired !== true)
    .map(([id]) => id);
};

const libraries = [
  'all',
  'en',
  'es',
  'pl',
];

export type LibraryData = Awaited<ReturnType<typeof library>>;

const libraryData = (language: string) => {
  return {
    id: `library/${language}`,
    orn: `https://openstax.org/orn/library/${language}`,
    type: 'library' as const,
    title: 'OpenStax Textbooks' + (language !== 'all' ? ` (${new Intl.DisplayNames(['en'], {type: 'language'}).of(language)})` : ''),
    urls: {
      main: 'https://openstax.org/subjects'
    },
  };
};

export const library = async(language: string = 'all') => {
  const liveBookIds = await cacheLiveOswebBooks();
  const bookIds = (await getBookIds()).filter((bookId) => liveBookIds.includes(bookId));
  const contents: Book[] = (await asyncPool(2, bookIds, (bookId: string) => book(bookId))).filter((book: Book) =>
    language === 'all' || book.language === language
  );

  return {
    ...libraryData(language),
    contents,
  };
};

export const bookCacheKey = (archivePath: string, id: string, bookVersion: string) =>
  `${archivePath.replace(/^\/apps\/archive\//, '')}-${id}@${bookVersion}.json`;

const archiveBook = async(bookId: string, bookContentVersion?: string, bookArchiveVersion?: string) => {
  const {archivePath, bookVersion} = await getArchiveInfo(bookId, bookContentVersion, bookArchiveVersion);
  return preloadedData(bookCacheKey(archivePath, bookId, bookVersion))
    .catch(() =>
      fetch(`https://openstax.org${archivePath}/contents/${bookId}@${bookVersion}.json`)
        .then(response => acceptResponse(response))
        .then(response => response.json())
    );
};

type BookSubject = { id: number; subject_name: string };
type BookCategory = { id: number; subject_name: string; subject_category: string };

const cachedLiveOswebBooks: Record<string, any> = {};
// Returns the cnx_ids of live books
const cacheLiveOswebBooks = async() => {
  let total_count = 1;
  let offset = 0;
  while (offset < total_count) {
    const responseData =
      await fetch(`${oswebUrl}?type=books.Book&book_state=live&fields=${fields}&offset=${offset}&limit=100`)
      .then((response) => acceptResponse(response))
      .then((response => response.json()));

    const { items } = responseData;
    if (items.length === 0) { break; }
    items.forEach((item: { cnx_id: string }) => { cachedLiveOswebBooks[item.cnx_id] = item; });

    total_count = responseData.meta.total_count;
    offset += items.length;
  }
  return Object.keys(cachedLiveOswebBooks);
};

const commonBook = memoize(async(id: string, version?: string, archive?: string) => {
  const oswebData = cachedLiveOswebBooks[id] ??
    await fetch(`${oswebUrl}?type=books.Book&fields=${fields}&cnx_id=${id}`)
    .then(response => acceptResponse(response))
    .then(response => response.json() as any)
    .then(data => data.items[0])
  ;

  const archiveData = await archiveBook(id, version, archive);
  const default_page_slug = oswebData.webview_rex_link.match(/\/books\/.*\/pages\/(.*)$/)?.[1] as string;
  const default_page = default_page_slug && findTreeNodeBySlug(default_page_slug, archiveData.tree);

  const subjects = oswebData.book_subjects ? oswebData.book_subjects.map(
    ({ id, subject_name }: BookSubject) => ({ id, name: subject_name })
  ) : [];

  const categories = oswebData.book_categories ? oswebData.book_categories.map(
    ({ id, subject_name, subject_category }: BookCategory) => ({ id, name: subject_category, subject_name })
  ) : [];

  return {
    oswebData,
    archiveData,
    book: {
      id,
      orn: `https://openstax.org/orn/book/${id}`,
      versionedOrn: `https://openstax.org/orn/book/${id}${version ? `@${version}${archive ? `:${archive}` : ''}` : ''}`,
      type: 'book' as const,
      state: oswebData.book_state as string,
      title: oswebData.title as string,
      subjects: subjects as BookSubject[],
      categories: categories as BookCategory[],
      language: archiveData.language as string,
      slug: oswebData.meta.slug as string,
      default_page: default_page ? mapTree(id, version, archive)(default_page) : undefined,
      theme: oswebData.cover_color as string,
      license: {
        holder: 'OpenStax',
        name: archiveData.license.name,
        url: archiveData.license.url,
      },
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

type Book = Awaited<ReturnType<typeof commonBook>>['book'];

export const book = async(id: string, version?: string, archive?: string) => {
  return (await commonBook(id, version, archive)).book;
};

export type TreePageElement = {id: string; title: string; titleParts: TitleParts; orn: string; versionedOrn: string; type: 'book:page'; slug: string; tocType: string; tocTargetType: string};
export type TreeSubTree = {id: string; title: string; titleParts: TitleParts; orn: string; versionedOrn: string; type: 'book:subbook'; contents: TreeElement[]; default_page: undefined | TreePageElement; tocType: string};
type TreeElement = TreePageElement | TreeSubTree;


type TocTypes = {
  tocType: string;
  tocTargetType?: string;
};
const mapTocType = (tree: any): TocTypes => {
  const tocTargetType = (tree['data-toc-target-type'] ?? tree['toc_target_type']) as string;
  return {
    tocType: (tree['data-toc-type'] ?? tree['toc_type']) as string,
    ...(tocTargetType ? {tocTargetType} : {}),
  };
};

type TreeNodeDataWithoutChildren = TreePageElement | Omit<TreeSubTree, 'contents'>;
const mapTreeNodeData = (bookId: string, bookContentVersion?: string, bookArchiveVersion?: string) => (tree: any): TreeNodeDataWithoutChildren => {
  if (tree.contents) {
    const subTreeId = tree.id.split('@')[0];
    const default_page = findTreeNode(t => !('contents' in t), tree);
    return {
      id: subTreeId,
      title: tree.title,
      titleParts: titleSplit(tree.title),
      default_page: default_page ? mapTree(bookId, bookContentVersion, bookArchiveVersion)(default_page) as TreePageElement : undefined,
      orn: `https://openstax.org/orn/book:subbook/${bookId}:${subTreeId}`,
      versionedOrn: `https://openstax.org/orn/book:subbook/${bookId}${bookContentVersion ? `@${bookContentVersion}${bookArchiveVersion ? `:${bookArchiveVersion}` : ''}` : ''}:${subTreeId}`,
      type: 'book:subbook',
      ...mapTocType(tree),
    };
  } else {
    const pageId = tree.id.split('@')[0];
    return {
      id: pageId,
      title: tree.title,
      titleParts: titleSplit(tree.title),
      orn: `https://openstax.org/orn/book:page/${bookId}:${pageId}`,
      versionedOrn: `https://openstax.org/orn/book:page/${bookId}${bookContentVersion ? `@${bookContentVersion}${bookArchiveVersion ? `:${bookArchiveVersion}` : ''}` : ''}:${pageId}`,
      slug: tree.slug,
      type: 'book:page',
      ...mapTocType(tree),
    } as TreePageElement;
  }
};

const mapTree = (bookId: string, bookContentVersion?: string, bookArchiveVersion?: string) => (tree: any): TreeElement => {
  if (tree.contents) {
    return {
      ...mapTreeNodeData(bookId, bookContentVersion, bookArchiveVersion)(tree),
      contents: tree.contents.map(mapTree(bookId, bookContentVersion, bookArchiveVersion)),
    } as TreeElement;
  } else {
    return mapTreeNodeData(bookId, bookContentVersion, bookArchiveVersion)(tree) as TreeElement;
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
    const withParent = {...node, parent: tree};
    const result = findTreeNode(predicate, withParent);
    if (result) {
      return result;
    }
  }
};

type BookDetail = Awaited<ReturnType<typeof bookDetail>>;

const bookDetailAndFriends = async(id: string, version?: string, archive?: string) => {
  const friends = await commonBook(id, version, archive);

  return {
    ...friends,
    book: {
      ...friends.book,
      contents: (friends.archiveData.tree.contents as any[]).map(mapTree(id, version, archive)),
    }
  };
};

export const bookDetail = (id: string, version?: string, archive?: string) => {
  return bookDetailAndFriends(id, version, archive).then(result => result.book);
};

export const subbook = async(
  {bookArchiveVersion, bookId, bookContentVersion, subbookId}: {
    bookArchiveVersion?: string; bookId: string; bookContentVersion?: string; subbookId: string;
  }
) => {
  const bookData = await book(bookId, bookContentVersion, bookArchiveVersion);
  const {archivePath, bookVersion} = await getArchiveInfo(bookId, bookContentVersion, bookArchiveVersion);
  const archiveUrl = `https://openstax.org${archivePath}/contents/${bookId}@${bookVersion}.json`;
  const archiveData = await fetch(archiveUrl)
    .then(response => acceptResponse(response))
    .then(response => response.json())
  ;

  const tree = findTreeNodeById(subbookId, archiveData.tree);
  const default_page = findTreeNode(t => !('contents' in t), tree);

  return {
    id: subbookId,
    title: tree.title as string,
    titleParts: titleSplit(tree.title),
    book: bookData,
    default_page: default_page ? mapTree(bookId, bookContentVersion, bookArchiveVersion)(default_page) : undefined,
    contents: (tree.contents as any[]).map(mapTree(bookId, bookContentVersion, bookArchiveVersion)),
    orn: `https://openstax.org/orn/book:subbook/${bookId}:${subbookId}`,
    versionedOrn: `https://openstax.org/orn/book:subbook/${bookId}${bookContentVersion ? `@${bookContentVersion}${bookArchiveVersion ? `:${bookArchiveVersion}` : ''}` : ''}:${subbookId}`,
    type: 'book:subbook' as const,
  };
};

const recursiveContext = (node: any): any[] => {
  if (node.parent) {
    return [...recursiveContext(node.parent), node];
  } else {
    return [node];
  }
};

const syncPageNodeData = (page: any, archiveBook: any, bookContentVersion?: string, bookArchiveVersion?: string) => {
  const pageId = page.id.split('@')[0];
  const bookId = archiveBook.id;
  const treeNode = findTreeNodeById(pageId, archiveBook.tree);

  const contextNodes = recursiveContext(treeNode).map(mapTreeNodeData(bookId, bookContentVersion, bookArchiveVersion));
  const thisNodeResult = contextNodes.slice(-1)[0];

  return {
    ...thisNodeResult as TreePageElement,
    context: contextNodes
      .filter(context => context.tocType && context.id !== pageId)
      .reduce((result, item) => ({...result, [item.tocType]: item}), {} as {[key: string]: TreeNodeDataWithoutChildren}),
    contextTitle: [
      ...contextNodes.slice(0, -1).map(item => item.titleParts.numberText || item.titleParts.title),
      thisNodeResult.titleParts.title
    ].join(' / '),
    contextTitles: contextNodes.map(item => item.titleParts.title),
  };
};

const pageWithData = async(
  {bookArchiveVersion, bookId, bookContentVersion, pageId}: {
    bookArchiveVersion?: string; bookId: string; bookContentVersion?: string; pageId: string;
  }
) => {
  const {archiveData: archiveBook, book: bookData} = await commonBook(bookId, bookContentVersion, bookArchiveVersion);
  const treeNode = findTreeNodeById(pageId, archiveBook.tree);

  const {archivePath, bookVersion} = await getArchiveInfo(bookId, bookContentVersion, bookArchiveVersion);
  const archiveUrl = `https://openstax.org${archivePath}/contents/${bookId}@${bookVersion}:${pageId}.json`;
  const archiveData = await fetch(archiveUrl)
    .then(response => acceptResponse(response))
    .then(response => response.json())
  ;

  const rexUrl = `https://openstax.org/books/${bookData.slug}/pages/${archiveData.slug}`;

  return [bookData, archiveData, {
    ...syncPageNodeData(treeNode, archiveBook, bookContentVersion, bookArchiveVersion),
    title: archiveData.title as string,
    book: bookData,
    slug: archiveData.slug as string,
    urls: {
      main: rexUrl as string,
      experience: rexUrl as string
    }
  }] as const;
};

export const page = async(args: {bookArchiveVersion?: string; bookId: string; bookContentVersion?: string; pageId: string}) => {
  const [,, pageResponse] = await pageWithData(args);
  return pageResponse;
};

export const element = async({bookArchiveVersion, bookId, bookContentVersion, pageId, elementId}: {bookArchiveVersion?: string; bookId: string; bookContentVersion?: string; pageId: string; elementId: string}) => {
  const [,, pageResponse] = await pageWithData({bookArchiveVersion, bookId, bookContentVersion, pageId});

  const url = `${pageResponse.urls.experience}#${elementId}`;
  const title = `Element in ${pageResponse.contextTitle}`;

  return {
    orn: `https://openstax.org/orn/book:page:element/${bookId}:${pageId}:${elementId}`,
    versionedOrn: `https://openstax.org/orn/book:page:element/${bookId}${bookContentVersion ? `@${bookContentVersion}${bookArchiveVersion ? `:${bookArchiveVersion}` : ''}` : ''}:${pageId}:${elementId}`,
    id: elementId,
    title,
    type: 'book:page:element' as const,
    page: pageResponse,
    urls: {
      main: url,
      experience: url
    }
  };
};

// This search type does not actually come from ORN
const assertElementSearchSource = (input: {}): SearchResultHitSourceElement => {
  if (isPlainObject(input) &&
      ['pageId', 'elementType', 'elementId', 'pagePosition'].every((field) => field in input) &&
      ['pageId', 'elementType', 'elementId'].every((field) => typeof input[field] === 'string') &&
      typeof input['pagePosition'] === 'number') {
    return input as SearchResultHitSourceElement;
  }

  throw new Error('received non-element result from elementSearch');
};

// ORN-specific type assertions currently just trust the "type" field

const assertBookDetail = (input: {}): BookDetail => {
  if (isPlainObject(input) && input.type === 'book') {
    return input as BookDetail;
  }

  throw new Error('received non-book result from bookSearch');
};

type Page = Awaited<ReturnType<typeof page>>;
const assertPage = (input: {}): Page => {
  if (isPlainObject(input) && input.type === 'book:page') {
    return input as Page;
  }

  throw new Error('received non-page result from pageSearch');
};

export const elementSearch = async(searchClient: SearchClient, query: string, limit: number): Promise<Awaited<ReturnType<typeof element>>[]> => {
  const bookIds = await getBookIds();
  const results = await doOpenSearch(searchClient, limit, query, bookIds, 'i1');

  return Promise.all(results.map(result => {
    const bookId = assertInstanceOf<string[]>(result.index.match(/__(.*)@/), Array)[1];
    const source = assertElementSearchSource(result.source);
    const pageId = source.pageId.split('@')[0];
    const elementId = source.elementId;
    return element({bookId, pageId, elementId});
  }));
};

export const librarySearch = async(searchClient: SearchClient, query: string, limit: number): Promise<LibraryData[]> => {
  return doLocateSearch({searchClient}, query, limit)(libraries.map(libraryData));
};

export const bookSearch = async(
  searchClient: SearchClient, query: string, limit: number, searchStrategy = 's1'
): Promise<BookDetail[]> => {
  const releaseId = await getReleaseId();
  const results = await doOpenSearch(searchClient, limit, query, [releaseId], 'i2', searchStrategy);

  return results.map(result => assertBookDetail(result.source));
};

export const pageSearch = async(
  searchClient: SearchClient, query: string, limit: number, searchStrategy = 's1'
): Promise<Page[]> => {
  const releaseId = await getReleaseId();
  const results = await doOpenSearch(searchClient, limit, query, [releaseId], 'i3', searchStrategy);

  return results.map(result => assertPage(result.source));
};

const doOpenSearch = async(
  searchClient: SearchClient, limit: number, q: string, books: string[], indexStrategy: string, searchStrategy = 's1'
) => {
  const results = await searchClient.search({q, books, indexStrategy, searchStrategy});

  return results.hits.hits.slice(0, limit);
};

const doLocateSearch = (options: LocateAllOptions, query: string, limit: number) => (inputs: any[]): Promise<any[]> => {
  const getScore = parseSearchQuery(query);
  const results = inputs.map(node => ({node, score: getScore(node)}))
    .filter(r => r.score > 0);

  results.sort((a, b) => b.score - a.score);

  return locateAll(
    options,
    results
      .slice(0, limit)
      .map(result => result.node.orn)
  );
};

const parseSearchQuery = (query: string) => {
  const quotedTerms = [...query.matchAll(/"([^"]+)"/g)].map(match => match[1]);

  const words = [...quotedTerms
    .reduce((result, quoted) => result.replace(`"${quoted}"`, ''), query)
    .matchAll(/([^ ]+)/g)]
    .map(match => match[1])
    .filter(word => word.match(/^\d+$/) || word.length > 3);

  const getScore = (node: any) => {
    const text = 'contextTitles' in node ? node.contextTitles.join(' ') : 'title' in node ? node.title : '';
    let score = 0;

    // this matches quoted terms surrounded by word boundaries
    score += (5 * quotedTerms.reduce((result, term) =>
      result + [...text.matchAll(new RegExp(`\\b${term}\\b`, 'ig'))].length, 0
    ));
    // this matches quoted terms without word boundaries
    score += (3 * quotedTerms.reduce((result, term) =>
      result + [...text.matchAll(new RegExp(`[^\\b\\s]${term}|${term}[^\\b\\s]`, 'ig'))].length, 0
    ));
    // this matches words with word boundaries
    score += (2 * words.reduce((result, term) =>
      result + [...text.replace(/[,"]/g, '').matchAll(new RegExp(`\\b${term}\\b`, 'ig'))].length, 0
    ));
    // this matches words without word boundaries
    score += words.reduce((result, term) =>
      // eslint-disable-next-line no-useless-escape
      result + [...text.replace(/[,"]/g, '').matchAll(new RegExp(`[^\\b\\s]${term}|${term}[^\\b\\s]`, 'ig'))].length, 0
    );

    return score;
  };

  return getScore;
};
