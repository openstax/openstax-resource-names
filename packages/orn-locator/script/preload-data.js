const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { getReleaseJson, bookCacheKey, getArchiveInfo } = require('../dist/cjs/resolvers/books.js')

// the cjs build is what the lambda bundle resolves through the `require` export
// condition, and books.js reads this data back via `import('../data/' + file)`
const dataDir = path.join(__dirname, '../dist/cjs/data');

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

  fs.mkdirSync(dataDir, {recursive: true});

  for (const load of files) {
    const [fileName, data] = await load();
    console.log('writing ' + fileName);
    fs.writeFileSync(path.join(dataDir, fileName), data);
  }
};

preloadData();
