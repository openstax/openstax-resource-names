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

export const book = async(id: string) => {
  const oswebData = await fetch(`${oswebUrl}?type=books.Book&fields=${fields}&cnx_id=${id}`)
    .then(response => response.json() as any)
    .then(data => data.items[0])
  ;

  return {
    id,
    orn: `https://openstax.org/orn/content:book/${id}`,
    type: 'content:book' as const,
    title: oswebData.title as string,
    slug: oswebData.meta.slug as string,
    theme: oswebData.cover_color as string,
    urls: {
      default: oswebData.meta.html_url as string,
      information: oswebData.meta.html_url as string,
      experience: oswebData.webview_rex_link as string,
    },
    images: {
      default: oswebData.cover_url as string,
      square: oswebData.cover_url as string,
      wide: oswebData.title_image_url as string,
      promotional: oswebData.promote_image.meta.download_url as string,
    }
  };
};

const mapTree = (bookId: string) => (tree: any) => {
  if (tree.contents) {
    const subTreeId = tree.id.split('@')[0];
    return {
      id: subTreeId as string,
      title: tree.title as string,
      contents: tree.contents.map(mapTree(bookId)),
      orn: `https://openstax.org/orn/content:collection/${bookId}:${subTreeId}`,
      type: 'content:collection' as const,
    };
  } else {
    const pageId = tree.id.split('@')[0];
    return {
      id: pageId as string,
      title: tree.title as string,
      orn: `https://openstax.org/orn/content:page/${bookId}:${pageId}`,
      type: 'content:page' as const,
    };
  }
};

const findTreeNode = (id: string, tree: any): any => {
  if (tree.id.split('@')[0] === id) {
    return tree;
  }

  for (const node of (tree.contents || [])) {
    const result = findTreeNode(id, node);
    if (result) {
      return result;
    }
  }
};

export const bookDetail = async(id: string) => {
  const bookData = await book(id);
  const {archivePath, bookVersion} = await getArchiveInfo(id);
  const archiveUrl = `https://openstax.org${archivePath}/contents/${id}@${bookVersion}.json`;
  const archiveData = await fetch(archiveUrl)
    .then(response => response.json())
  ;

  return {
    ...bookData,
    contents: archiveData.tree.contents.map(mapTree(id)),
  };
};

export const collection = async({bookId, collectionId}: {bookId: string; collectionId: string}) => {
  const bookData = await book(bookId);
  const {archivePath, bookVersion} = await getArchiveInfo(bookId);
  const archiveUrl = `https://openstax.org${archivePath}/contents/${bookId}@${bookVersion}.json`;
  const archiveData = await fetch(archiveUrl)
    .then(response => response.json())
  ;

  const tree = findTreeNode(collectionId, archiveData.tree);

  return {
    id: collectionId,
    title: tree.title as string,
    book: bookData,
    contents: tree.contents.map(mapTree(bookId)),
    orn: `https://openstax.org/orn/content:collection/${bookId}:${collectionId}`,
    type: 'content:collection' as const,
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
    orn: `https://openstax.org/orn/content:page/${bookId}:${pageId}`,
    id: pageId,
    type: 'content:page' as const,
    title: archiveData.title as string,
    book: bookData,
    slug: archiveData.slug as string,
    urls: {
      default: rexUrl as string,
      experience: rexUrl as string
    }
  };
};

export const element = async({bookId, pageId, elementId}: {bookId: string; pageId: string; elementId: string}) => {
  const pageData = await page({bookId, pageId});

  const url = `${pageData.urls.experience}#${elementId}`;

  return {
    orn: `https://openstax.org/orn/content:element/${bookId}:${pageId}:${elementId}`,
    id: elementId,
    type: 'content:element' as const,
    page: pageData,
    urls: {
      default: url,
      experience: url
    }
  };
};
