<!-- spell-checker: ignore creds -->
## Project Template

SPA React frontend with a serverless lambda backend, supported by aws data stores. fullstack typescript.

features:
- monorepo for frontend, lambda functions, deployment scripts
- strong fullstack typescript support even across api calls
- one command development server script
- one command deployment script
- production ready with error handling, logging, alerting
- established paradigms for common issues like routing, middleware, pagination, configs, dependency injection, plug-able service drivers per environment
- service providers for versioned document storage, file storage, document search, openstax accounts auth
- 100% test coverage using jest in both frontend and lambda modules
- CI checks for unit tests, spell checking, code linting, code coverage

## Design Goals

### Easy and Full Featured

Setting up a new project or microservice using raw libraries or tools like SAM is pretty easy, but leaves a lot of problems unsolved. developers end up having to solve a lot of problems over and over again, or cutting corners. There are, surprisingly, not a lot of software frameworks designed to work in a serverless environment, so every time you need to figure out how do error logging, or routing. maybe there is a lot of copy/paste there once you've done it a few times, but not everyone has done it a few times, and its still a project if you have. Sometimes you think you can quickly bang out a service that does xyz, and it doesn't need any frills, but then it turns out it sure would have been nice to have a data store, or an admin interface, and it doesn't send any alerts when it has errors, and that takes the project into a whole new problem space.

This project aims to provide a baseline level of production-readiness, in addition to easily accessible prebuilt functionality for common problems.

### Cohesive

A big problem in the javascript world is lack of cohesive systems. for any given problem there are a thousand npm modules that could help you, but given a set of problems, finding solutions that can work well together is a challenge.

This project aims to provide a full stack developer experience using similar tools and patterns across the project, and typescript support as strong as we can make it.


## Getting Started with the Project Template

### Set up your repo
- clone this repo
- delete packages/utils (it'll pull it from npm) (this isn't true yet, don't do this)
- reset the git history (delete .git and run `git init; git commit -am "initial commit"` again)
- follow the [development](#development) instructions to start your local environment

### Get into the Code
- start checking out the api code from the [routes file](./packages/lambda/src/functions/serviceApi/versions/v0/example/routes.ts). this example provides basic entity data storage, there are lots of comments in there.
- start checking out the frontend code from the [homepage](./packages/frontend/src/example/screens/Home.tsx), there are a few pages that integrate with the example api routes.
- more info about the libraries and utils used in the [utils module](./packages/utils/README.md)

### your first deployment
- change the `APPLICATION` in [the deployment constants file](./deploy/constants.env). the first time you run the deployment it'll
walk you through some one-time setup stuff. it'll output the deployed url when it finishes.
- upload some secrets to the parameter store with `AccountsBase=SOMETHING CookieName=SOMETHING EncryptionPrivateKey=SOMETHING SignaturePublicKey=SOMETHING yarn ts-utils upload-params <environment-name>`.
- (optional) set PagerDuty params with `yarn -s ts-utils upload-pager-duty-endpoints`

## Development

install [nvm](https://github.com/creationix/nvm#installation)

```

# use the right version of node
nvm install

# install yarn, skip if you have it already
npm install -g yarn

# install dependencies
yarn install

# start
#  run this from the project root, it builds the utils and lambda packages,
#  sets up build watchers for them, and then starts the react app.
#  changes in any package are built and visible in the app immediately.
yarn start
```

### to fix scary untrusted cert warning in chrome

*note:* you must do this for login to work

#### trust the certificate
- run `./packages/frontend/script/trust-localhost.bash` after starting the server

## Deployment

dependencies: aws-sdk, jq

```
# if you don't have https://github.com/openstax/ox-bin set up you can call this directly from
# your local https://github.com/openstax/aws-access/blob/main/scripts/set_aws_creds
. ox set_aws_creds -i assume-role -r sandbox:full-admin
yarn -s ts-utils deploy my-cool-environment
```
