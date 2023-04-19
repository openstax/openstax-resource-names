import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { TestServiceProvider } from "../../tests/testServices";
import * as api from "../api";
import { thingListScreen } from "./ThingList";

afterEach(() => {
  jest.clearAllMocks();
});

describe('ThingList', () => {
  let apiV0SearchExampleDocSpy: jest.SpyInstance;

  beforeEach(() => {
    apiV0SearchExampleDocSpy = jest.fn();

    jest.spyOn(api, 'useApiClient').mockReturnValue({
      apiV0SearchExampleDoc: apiV0SearchExampleDocSpy
    } as any);
  });

  it('shows results', async() => {
    apiV0SearchExampleDocSpy.mockReturnValue(Promise.resolve({
      acceptStatus: () => ({status: 200, load: () => ({meta: {}, items: [{id: 'some id', name: 'some name'}]})}),
    }));

    render(<TestServiceProvider>{thingListScreen.handler(undefined, undefined)}</TestServiceProvider>);

    await waitFor(() => {
      const dataElement = screen.getByText(/some name/i);
      expect(dataElement).toBeInTheDocument();
    });
  });

  it('shows next link', async() => {
    apiV0SearchExampleDocSpy.mockReturnValue(Promise.resolve({
      acceptStatus: () => ({status: 200, load: () => ({meta: {currentPage: 1, totalPages: 5}, items: []})}),
    }));

    render(<TestServiceProvider>{thingListScreen.handler(undefined, undefined)}</TestServiceProvider>);

    await waitFor(() => {
      const dataElement = screen.getByText(/next page/i);
      expect(dataElement).toBeInTheDocument();
    });
  });

  it('shows prev link', async() => {
    apiV0SearchExampleDocSpy.mockReturnValue(Promise.resolve({
      acceptStatus: () => ({status: 200, load: () => ({meta: {currentPage: 4, totalPages: 5}, items: []})}),
    }));

    render(<TestServiceProvider>{thingListScreen.handler(undefined, undefined)}</TestServiceProvider>);

    await waitFor(() => {
      const dataElement = screen.getByText(/prev page/i);
      expect(dataElement).toBeInTheDocument();
    });
  });

  it('renders error on unexpected status', async() => {
    apiV0SearchExampleDocSpy.mockReturnValue(Promise.resolve({
      acceptStatus: () => { throw new Error(); },
    }));

    render(<TestServiceProvider>{thingListScreen.handler(undefined, undefined)}</TestServiceProvider>);

    await waitFor(() => {
      const dataElement = screen.getByText(/connection failed/i);
      expect(dataElement).toBeInTheDocument();
    });
  });

  it('renders fetch failed', async() => {
    apiV0SearchExampleDocSpy.mockReturnValue(Promise.reject({ }));

    render(<TestServiceProvider>{thingListScreen.handler(undefined, undefined)}</TestServiceProvider>);

    await waitFor(() => {
      const dataElement = screen.getByText(/connection failed/i);
      expect(dataElement).toBeInTheDocument();
    });
  });
});
