import { createProfile } from '@openstax/ts-utils/profile';
import { stubAuthProvider, User } from '@openstax/ts-utils/services/authProvider';
import { AppServices } from '../../../core';
import { documentStoreMiddleware } from './documentStoreMiddleware';

describe('documentStoreMiddleware', () => {
  const envBack = process.env;

  beforeEach(() => {
    process.env = {...process.env};
  });

  afterEach(() => {
    process.env = envBack;
  });

  it('getAuthor produces audit entry', async() => {
    process.env.ExampleDocumentTableName = 'some_name';
    const authProvider = stubAuthProvider({uuid: 'a uuid', name: 'a name'} as User);

    let getAuthor: any;

    const versionedDocumentStoreInner = jest.fn((_1, _2, getAuthorArg) => { getAuthor = getAuthorArg;});
    const versionedDocumentStore = jest.fn().mockReturnValue(jest.fn().mockReturnValue(versionedDocumentStoreInner));
    documentStoreMiddleware({versionedDocumentStore} as unknown as AppServices)({authProvider, profile: createProfile('').start()});

    expect(getAuthor).toBeDefined();
    expect(await getAuthor()).toEqual({
      type: 'user',
      uuid: 'a uuid',
      name: 'a name',
    });
    expect(await getAuthor('a reason')).toEqual({
      type: 'user',
      uuid: 'a uuid',
      name: 'a name',
      reason: 'a reason',
    });
  });

  it('getAuthor throws without user', async() => {
    process.env.ExampleDocumentTableName = 'some_name';
    const authProvider = stubAuthProvider();

    let getAuthor: any;

    const versionedDocumentStoreInner = jest.fn((_1, _2, getAuthorArg) => { getAuthor = getAuthorArg;});
    const versionedDocumentStore = jest.fn().mockReturnValue(jest.fn().mockReturnValue(versionedDocumentStoreInner));
    documentStoreMiddleware({versionedDocumentStore} as unknown as AppServices)({authProvider, profile: createProfile('').start()});

    expect(getAuthor).toBeDefined();
    await expect(getAuthor()).rejects.toThrow();
  });
});
