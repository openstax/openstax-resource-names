import memoize from 'lodash/fp/memoize';
import asyncPool from 'tiny-async-pool/lib/es6';
import { filterResourceContents, isResourceOrContentOfTypeFilter, locateAll } from '..';
import { patterns } from '../ornPatterns';
import { fetch } from '../utils/browsersafe-fetch';
import { TitleParts, titleSplit } from '../utils/browsersafe-title-split';

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

const getBookIds = async () => {
  const releaseJson = await getReleaseJson();
  return Object.entries(releaseJson.books)
    .filter(([, config]: [any, any]) => config.retired !== true)
    .map(([id]) => id);
};

export const library = async(language: string) => {
  const bookIds = await getBookIds();
  const contents: Book[] = (await asyncPool(2, bookIds, book)).filter((book: Book) =>
    (language === 'all' || book.language === language) && book.state === 'live'
  );

  return {
    id: 'library',
    orn: 'https://openstax.org/orn/library',
    type: 'library' as const,
    title: 'OpenStax Textbooks',
    urls: {
      main: 'https://openstax.org/subjects'
    },
    contents,
  };
};

const archiveBook = memoize(async(id: string) => {
  const {archivePath, bookVersion} = await getArchiveInfo(id);
  const archiveUrl = `https://openstax.org${archivePath}/contents/${id}@${bookVersion}.json`;
  return fetch(archiveUrl)
    .then(response => response.json());
});

const commonBook = memoize(async(id: string) => {
  const oswebData = await fetch(`${oswebUrl}?type=books.Book&fields=${fields}&cnx_id=${id}`)
    .then(response => response.json() as any)
    .then(data => data.items[0])
  ;

  const archiveData = await archiveBook(id);
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

export const book = async(id: string) => {
  return (await commonBook(id)).book;
};

export type TreePageElement = {id: string; title: string; titleParts: TitleParts; orn: string; type: 'book:page'; slug: string; tocType: string; tocTargetType: string};
export type TreeSubTree = {id: string; title: string; titleParts: TitleParts; orn: string; type: 'book:subbook'; contents: TreeElement[]; default_page: undefined | TreePageElement; tocType: string};
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
const mapTreeNodeData = (bookId: string) => (tree: any): TreeNodeDataWithoutChildren => {
  if (tree.contents) {
    const subTreeId = tree.id.split('@')[0];
    const default_page = findTreeNode(t => !('contents' in t), tree);
    return {
      id: subTreeId,
      title: tree.title,
      titleParts: titleSplit(tree.title),
      default_page: default_page ? mapTree(bookId)(default_page) as TreePageElement : undefined,
      orn: `https://openstax.org/orn/book:subbook/${bookId}:${subTreeId}`,
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
      slug: tree.slug,
      type: 'book:page',
      ...mapTocType(tree),
    } as TreePageElement;
  }
};

const mapTree = (bookId: string) => (tree: any): TreeElement => {
  if (tree.contents) {
    return {
      ...mapTreeNodeData(bookId)(tree),
      contents: tree.contents.map(mapTree(bookId)),
    } as TreeElement;
  } else {
    return mapTreeNodeData(bookId)(tree) as TreeElement;
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

const bookDetailAndFriends = memoize(async(id: string) => {
  const friends = await commonBook(id);

  return {
    ...friends,
    book: {
      ...friends.book,
      contents: (friends.archiveData.tree.contents as any[]).map(mapTree(id)),
    }
  };
});

export const bookDetail = (id: string) => {
  return bookDetailAndFriends(id).then(result => result.book);
};

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

const recursiveContext = (node: any): any[] => {
  if (node.parent) {
    return [...recursiveContext(node.parent), node];
  } else {
    return [node];
  }
};

const syncPageNodeData = (page: any, archiveBook: any) => {
  const pageId = page.id.split('@')[0];
  const bookId = archiveBook.id;
  const treeNode = findTreeNodeById(pageId, archiveBook.tree);

  const contextNodes = recursiveContext(treeNode).map(mapTreeNodeData(bookId));
  const thisNodeResult = contextNodes.slice(-1)[0];

  return {
    ...thisNodeResult,
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

const pageWithData = async({bookId, pageId}: {bookId: string; pageId: string}) => {
  const {archiveData: archiveBook, book: bookData} = await commonBook(bookId);
  const treeNode = findTreeNodeById(pageId, archiveBook.tree);

  const {archivePath, bookVersion} = await getArchiveInfo(bookId);
  const archiveUrl = `https://openstax.org${archivePath}/contents/${bookId}@${bookVersion}:${pageId}.json`;
  const archiveData = await fetch(archiveUrl)
    .then(response => response.json())
  ;

  const rexUrl = `https://openstax.org/books/${bookData.slug}/pages/${archiveData.slug}`;

  return [bookData, archiveData, {
    ...syncPageNodeData(treeNode, archiveBook),
    title: archiveData.title as string,
    book: bookData,
    slug: archiveData.slug as string,
    urls: {
      main: rexUrl as string,
      experience: rexUrl as string
    }
  }] as const;
};

export const page = async(args: {bookId: string; pageId: string}) => {
  const [,, pageResponse] = await pageWithData(args);
  return pageResponse;
};

export const element = async({bookId, pageId, elementId}: {bookId: string; pageId: string; elementId: string}) => {
  const [,, pageResponse] = await pageWithData({bookId, pageId});

  const url = `${pageResponse.urls.experience}#${elementId}`;
  const title = `Element in ${pageResponse.contextTitle}`;

  return {
    orn: `https://openstax.org/orn/book:page:element/${bookId}:${pageId}:${elementId}`,
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

export const elementSearch = async(query: string, limit: number, filters: {[key: string]: string | string[]} = {}): Promise<Awaited<ReturnType<typeof element>>[]> => {
  const scopes = 'scope' in filters
    ? (await locateAll(typeof filters.scope === 'string' ? [filters.scope] : filters.scope))
      .filter(isResourceOrContentOfTypeFilter(['book']))
      .map(book => book.id)
    : (await library('all')).contents.map(book => book.id);

  const books = await Promise.all(scopes.map(async bookId => {
    const {archivePath, bookVersion} = await getArchiveInfo(bookId);
    const archiveVersion = archivePath.replace('/apps/archive/', '');
    return `${archiveVersion}/${bookId}@${bookVersion}`;
  }));

  return fetch(`https://openstax.org/open-search/api/v0/search?q=${query}&books=${encodeURIComponent(books.join(','))}&index_strategy=i1&search_strategy=s1`)
    .then(response => response.json())
    .then(json => json.hits.hits.slice(0, limit) as any[])
    .then(results => Promise.all(results.map(result => {
      const bookId = result._index.match(/__(.*)@/)[1];
      const pageId = result._source.page_id.split('@')[0];
      const elementId = result._source.element_id;
      return element({bookId, pageId, elementId});
    })));
};

export const bookSearch = async(query: string, limit: number, filters: {[key: string]: string | string[]} = {}): Promise<BookDetail[]> => {
  const bookIds = 'scope' in filters
    ? (typeof filters.scope === 'string' ? [filters.scope] : filters.scope)
      .map(bookOrn => {
        const match = patterns.book.match(bookOrn);
        if (match) {
          return match.params.id;
        }

        return undefined;
      })
      .filter(<X>(x: X): x is X & Exclude<undefined, X> => x !== undefined)
    : await getBookIds();


  return Promise.all(bookIds.map(book))
    .then(doSearch(query, limit));
};
export const pageSearch = async(query: string, limit: number, filters: {[key: string]: string | string[]} = {}): Promise<Awaited<ReturnType<typeof page>>[]> => {
  const bookIds = 'scope' in filters
    ? (typeof filters.scope === 'string' ? [filters.scope] : filters.scope)
      .map(bookOrn => {
        const match = patterns.book.match(bookOrn);
        if (match) {
          return match.params.id;
        }

        return undefined;
      })
      .filter(<X>(x: X): x is X & Exclude<undefined, X> => x !== undefined)
    : await getBookIds();


  return Promise.all(bookIds.map(bookDetailAndFriends))
    .then(results => results.map(({archiveData: archiveBook, book}) => {
      const pages = filterResourceContents(book, ['book:page']);
      return pages.map(page => ({...page, ...syncPageNodeData(page, archiveBook)}));
    }))
    .then(results => results.flat())
    .then(doSearch(query, limit));
};

const doSearch = (query: string, limit: number) => (inputs: any[]): Promise<any[]> => {
  const getScore = parseSearchQuery(query);
  const results = inputs.map(node => ({node, score: getScore(node)}));

  results.sort((a, b) => b.score - a.score);

  return locateAll(
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
