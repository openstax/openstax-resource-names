import { createConsoleLogger } from '@openstax/ts-utils/services/logger/console';
import { reindexSearch } from './handler';
import * as targetsModule from './targets';

jest.mock('./targets', () => ({
  makeReindexTargets: jest.fn(),
}));

describe('reindexSearch', () => {
  const services = {} as targetsModule.ReindexServices;
  const logger = createConsoleLogger();
  const result = {indexed: 2, failed: 0, nextPageToken: 'next token'};
  let exampleDocument: jest.Mock;

  beforeEach(() => {
    exampleDocument = jest.fn().mockResolvedValue(result);
    (targetsModule.makeReindexTargets as jest.Mock).mockReturnValue({exampleDocument});
  });

  it('builds targets from the given services', async() => {
    await reindexSearch(services, logger, {target: 'exampleDocument'});
    expect(targetsModule.makeReindexTargets).toHaveBeenCalledWith(services);
  });

  it('reindexes the requested target', async() => {
    const event = {target: 'exampleDocument' as const, pageToken: 'some token'};

    expect(await reindexSearch(services, logger, event)).toBe(result);
    expect(exampleDocument).toHaveBeenCalledWith(logger, event);
  });

  it('rejects a non-boolean reset', async() => {
    await expect(reindexSearch(services, logger, {target: 'exampleDocument', reset: 'false' as unknown as boolean}))
      .rejects.toThrow('reset must be a boolean, got "false"');
    expect(exampleDocument).not.toHaveBeenCalled();
  });

  it('rejects reset with a page token', async() => {
    await expect(reindexSearch(services, logger, {target: 'exampleDocument', pageToken: 'some token', reset: true}))
      .rejects.toThrow('reset can only be used when starting a reindex');
    expect(exampleDocument).not.toHaveBeenCalled();
  });

  it('rejects unknown targets', async() => {
    await expect(reindexSearch(services, logger, {target: 'toString' as 'exampleDocument'}))
      .rejects.toThrow('unknown reindex target "toString", expected one of: exampleDocument');
  });
});
