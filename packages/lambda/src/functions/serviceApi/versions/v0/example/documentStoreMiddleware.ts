import { assertDefined } from '@openstax/ts-utils/assertions';
import { envConfig } from '@openstax/ts-utils/config';
import { UnauthorizedError } from '@openstax/ts-utils/errors';
import {Track} from '@openstax/ts-utils/profile';
import { AuthProvider } from '@openstax/ts-utils/services/authProvider';
import { VersionedDocumentRequiredFields } from '@openstax/ts-utils/services/versionedDocumentStore';
import { AppServices } from '../../../core';

export type ExampleDocument = {
  id: string;
  name: string;
  description: string;
} & VersionedDocumentRequiredFields;

const config = {
  fileSystem: {
    tableName: 'example-document'
  },
  dynamodb: {
    tableName: envConfig('EXAMPLE_TABLE_NAME', 'runtime'),
  }
};

export const documentStoreMiddleware = <M extends {authProvider: AuthProvider; profile: Track}>(app: AppServices) => {
  const makeExampleDocumentStore = app.versionedDocumentStore<ExampleDocument>()(config);

  return (middleware: M) => {
    const getAuthor = async(reason?: string) => {
      const user = assertDefined(await middleware.authProvider.getUser(), new UnauthorizedError());
      return {type: 'user' as const, uuid: user.uuid, name: user.name, ...(reason ? {reason} : {})};
    };

    return {
      ...middleware,
      exampleDocumentStore: makeExampleDocumentStore(middleware, 'id', getAuthor),
    };
  };
};

export type ExampleDocumentStore = ReturnType<ReturnType<typeof documentStoreMiddleware>>['exampleDocumentStore'];
