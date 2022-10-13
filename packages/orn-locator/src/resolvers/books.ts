import fetch from 'node-fetch';

const oswebUrl = 'https://openstax.org/apps/cms/api/v2/pages';
const fields = 'cnx_id,authors,publish_date,cover_color,amazon_link,book_state,promote_image,webview_rex_link,cover_url,title_image_url';

export const book = async(id: string) => {
  const oswebData = await fetch(`${oswebUrl}?type=books.Book&fields=${fields}&cnx_id=${id}`)
    .then(response => response.json() as any)
    .then(data => data.items[0])
  ;

  return {
    id,
    type: 'book',
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

export const page = async({bookId, pageId}: {bookId: string; pageId: string}) => {
  const bookData = await book(bookId);

  const releaseJson = await fetch('https://openstax.org/rex/release.json')
    .then(response => response.json())
  ;

  const bookConfig = releaseJson.books[bookId];

  const archivePath = bookConfig.archiveOverride || releaseJson.archiveUrl;
  const archiveUrl = `https://openstax.org${archivePath}/contents/${bookId}@${bookConfig.defaultVersion}:${pageId}.json`;

  const archiveData = await fetch(archiveUrl)
    .then(response => response.json())
  ;

  const rexUrl = `https://openstax.org/books/${bookData.slug}/pages/${archiveData.slug}`;

  return {
    id: pageId,
    type: 'page',
    title: archiveData.title,
    book: bookData,
    slug: archiveData.slug,
    urls: {
      default: rexUrl,
      experience: rexUrl
    }
  };
};
