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
    type: 'content:book',
    title: oswebData.title,
    slug: oswebData.meta.slug,
    theme: oswebData.cover_color,
    urls: {
      default: oswebData.meta.html_url,
      information: oswebData.meta.html_url,
      experience: oswebData.webview_rex_link,
    },
    images: {
      default: oswebData.cover_url,
      square: oswebData.cover_url,
      wide: oswebData.title_image_url,
      promotional: oswebData.promote_image.meta.download_url,
    }
  };
};

const mapTree = (bookId: string) => (tree: any) => {
  if (tree.contents) {
    const subTreeId = tree.id.split('@')[0];
    return {
      id: subTreeId,
      title: tree.title,
      contents: tree.contents.map(mapTree(bookId)),
      orn: `https://openstax.org/orn/content:collection/${bookId}:${subTreeId}`,
      type: 'content:collection',
    };
  } else {
    const pageId = tree.id.split('@')[0];
    return {
      id: pageId,
      title: tree.title,
      orn: `https://openstax.org/orn/content:page/${bookId}:${pageId}`,
      type: 'content:page',
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
    title: tree.title,
    book: bookData,
    contents: tree.contents.map(mapTree(bookId)),
    orn: `https://openstax.org/orn/content:collection/${bookId}:${collectionId}`,
    type: 'content:collection',
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
    type: 'content:page',
    title: archiveData.title,
    book: bookData,
    slug: archiveData.slug,
    urls: {
      default: rexUrl,
      experience: rexUrl
    }
  };
};

export const element = async({bookId, pageId, elementId}: {bookId: string; pageId: string; elementId: string}) => {
  const pageData = await page({bookId, pageId});

  const url = `${pageData.urls.experience}#${elementId}`;

  return {
    orn: `https://openstax.org/orn/content:element/${bookId}:${pageId}:${elementId}`,
    id: elementId,
    type: 'content:element',
    page: pageData,
    urls: {
      default: url,
      experience: url
    }
  };
};
