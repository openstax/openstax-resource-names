import { InvalidRequestError, NotFoundError, UnauthorizedError } from '@openstax/ts-utils/errors';

type ResponseLike = { status: number; text: () => Promise<string> };

export const acceptResponse = async<T extends ResponseLike>(response: T, statusCodes?: number[]) => {
  if ((statusCodes ?? [200]).includes(response.status)) { return response; }

  const message = await response.text();
  switch (response.status) {
    case 400:
      throw new InvalidRequestError(message);
    case 401:
      throw new UnauthorizedError(message);
    case 404:
      throw new NotFoundError(message);
    default:
      throw new Error(message);
  }
};
