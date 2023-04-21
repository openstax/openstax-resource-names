import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { homeScreen } from "./Home";
import { TestServiceProvider, testApiGateway } from "../../tests/testServices";
import { User, stubAuthProvider } from "@openstax/ts-utils/services/authProvider";

beforeEach(() => {
  testApiGateway.apiV0Info = jest.fn().mockReturnValue(Promise.resolve({
    acceptStatus: (...num: number[]) => ({load: () => ({message: 'message'})}),
  }));
});

afterEach(() => {
  delete testApiGateway.apiV0Info;
  jest.clearAllMocks();
});

describe('Home', () => {
  it('renders logged out', async() => {
    const services = {
      configProvider: {
        getConfig: async() => ({
          EXAMPLE_MESSAGE: 'hello from /api/v0/info',
        }),
      } as any,
    };
    render(<TestServiceProvider {...services}>{homeScreen.handler(undefined, {} as any)}</TestServiceProvider>);

    await waitFor(() => {
      const linkElement = screen.getByText(/login/i);
      expect(linkElement).toBeInTheDocument();
    });
  });

  it('renders logged in', async() => {
    const services = {
      authProvider: {
        ...stubAuthProvider({} as User),
        getAuthorizedUrl: (url: string) => url,
        getAuthorizedLinkUrl: (url: string) => url,
        getAuthorizedEmbedUrl: (url: string) => url,
      },
      configProvider: {
        getConfig: async() => ({
          EXAMPLE_MESSAGE: 'hello from /api/v0/info',
        }),
      } as any,
    };
    render(<TestServiceProvider {...services}>{homeScreen.handler(undefined, {} as any)}</TestServiceProvider>);

    await waitFor(() => {
      const messageElement = screen.getByText('hello from /api/v0/info');
      expect(messageElement).toBeInTheDocument();
    });

    await waitFor(() => {
      const linkElement = screen.getByText(/logout/i);
      expect(linkElement).toBeInTheDocument();
    });
  });
});
