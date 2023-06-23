// tslint:disable:no-console
const { argv } = require('yargs');
const { startServer } = require('.');

startServer(argv)
  .then(({port}) => console.log(`WEBSERVER: running on port: ${port}`))
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  })
;
