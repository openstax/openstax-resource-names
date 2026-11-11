import { dynamoVersionedDocumentStore } from '@openstax/ts-utils/services/documentStore/versioned/dynamodb';
import { openSearchService } from '@openstax/ts-utils/services/searchProvider/openSearch';

export const lambdaServices = {
  versionedDocumentStore: dynamoVersionedDocumentStore(),
  createSearchProvider: openSearchService({configSpace: 'deployed'}),
};

export type LambdaServices = typeof lambdaServices;
