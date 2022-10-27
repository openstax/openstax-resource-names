import fetch from 'node-fetch';

const oswebUrl = 'https://openstax.org/apps/cms/api/v2/pages';
const fields = 'cnx_id,authors,publish_date,cover_color,amazon_link,book_state,promote_image,webview_rex_link,cover_url,title_image_url';

const getArchiveInfo = async (bookId: string) => {
  const releaseJson = await fetch('https://openstax.org/rex/release.json')
    .then(response => response.json())
  ;

  const bookConfig = releaseJson.books[bookId];

  return {
    archivePath: bookConfig.archiveOverride || releaseJson.archiveUrl,
    bookVersion: bookConfig.defaultVersion,
  };
};

export const library = async(language: string) => {
  const releaseJson = await fetch('https://openstax.org/rex/release.json')
    .then(response => response.json())
  ;

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
        book.language === language
        && book.state === 'live'
      ),
  };
};

const commonBook = async(id: string) => {
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
};

export const book = async(id: string) => {
  return (await commonBook(id)).book;
};

const mapTree = (bookId: string) => (tree: any) => {
  if (tree.contents) {
    const subTreeId = tree.id.split('@')[0];
    return {
      id: subTreeId as string,
      title: tree.title as string,
      contents: tree.contents.map(mapTree(bookId)),
      orn: `https://openstax.org/orn/book:subbook/${bookId}:${subTreeId}`,
      type: 'book:subbook' as const,
    };
  } else {
    const pageId = tree.id.split('@')[0];
    return {
      id: pageId as string,
      title: tree.title as string,
      orn: `https://openstax.org/orn/book:page/${bookId}:${pageId}`,
      slug: tree.slug as string,
      type: 'book:page' as const,
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

export const bookDetail = async(id: string) => {
  const {archiveData, book} = await commonBook(id);

  return {
    ...book,
    contents: archiveData.tree.contents.map(mapTree(id)),
  };
};

export const subbook = async({bookId, subbookId}: {bookId: string; subbookId: string}) => {
  const bookData = await book(bookId);
  const {archivePath, bookVersion} = await getArchiveInfo(bookId);
  const archiveUrl = `https://openstax.org${archivePath}/contents/${bookId}@${bookVersion}.json`;
  const archiveData = await fetch(archiveUrl)
    .then(response => response.json())
  ;

  const tree = findTreeNodeById(subbookId, archiveData.tree);

  return {
    id: subbookId,
    title: tree.title as string,
    book: bookData,
    contents: tree.contents.map(mapTree(bookId)),
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
