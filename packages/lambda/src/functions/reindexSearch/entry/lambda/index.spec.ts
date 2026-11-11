import * as handlerModule from '../../handler';
import { lambdaServices } from './services';
import { handler } from '.';

jest.mock('../../handler', () => ({
  reindexSearch: jest.fn(),
}));

describe('handler', () => {
  it('reindexes with the lambda services', async() => {
    const result = {indexed: 1, nextPageToken: 'next token'};
    (handlerModule.reindexSearch as jest.Mock).mockResolvedValue(result);
    const event = {target: 'exampleDocument' as const, pageToken: 'some token'};

    expect(await handler(event)).toBe(result);
    expect(handlerModule.reindexSearch).toHaveBeenCalledWith(lambdaServices, expect.anything(), event);
  });
});
