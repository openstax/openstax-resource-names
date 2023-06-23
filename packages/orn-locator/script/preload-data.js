const { getReleaseJson, bookCacheKey, getArchiveInfo } = require('../dist/resolvers/books.js')
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const preloadData = async() => {
  const releaseJson = await getReleaseJson();

  const files = [
    //() => Promise.resolve(['release.json', JSON.stringify(releaseJson)]),
    ...Object.entries(releaseJson.books)
      .filter(([, config]) => config.retired !== true)
      .map(([id]) => async() => {
        const {archivePath, bookVersion} = await getArchiveInfo(id);
        return [
          bookCacheKey(archivePath, id, bookVersion),
          await fetch(`https://openstax.org${archivePath}/contents/${id}@${bookVersion}.json`)
            .then(response => response.text())
        ];
      })
  ];

  fs.mkdirSync(path.join(__dirname, '../dist/data'));

  for (const load of files) {
    const [fileName, data] = await load();
    console.log('writing ' + fileName);
    fs.writeFileSync(path.join(__dirname, '../dist/data',  fileName), data);
  }
};

preloadData();
