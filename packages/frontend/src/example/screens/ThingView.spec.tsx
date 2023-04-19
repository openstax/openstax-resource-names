import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { TestServiceProvider } from "../../tests/testServices";
import * as api from "../api";
import { thingViewScreen } from "./ThingView";


afterEach(() => {
  jest.clearAllMocks();
});

describe('ThingView', () => {
  let apiV0GetExampleDocSpy: jest.SpyInstance;

  beforeEach(() => {
    apiV0GetExampleDocSpy = jest.fn();

    jest.spyOn(api, 'useApiClient').mockReturnValue({
      apiV0GetExampleDoc: apiV0GetExampleDocSpy
    } as any);
  });

  it('queries given document', async() => {
    apiV0GetExampleDocSpy.mockReturnValue(Promise.resolve({
      acceptStatus: () => ({status: 200, load: () => ({theData: 'this is the data'})}),
    }));

    render(<TestServiceProvider>{thingViewScreen.handler({id: 'some id'}, undefined)}</TestServiceProvider>);

    await waitFor(() => {
      expect(apiV0GetExampleDocSpy).toHaveBeenCalledWith({params: {key: 'some id'}});
    });
  });

  it('renders data', async() => {
    apiV0GetExampleDocSpy.mockReturnValue(Promise.resolve({
      acceptStatus: () => ({status: 200, load: () => ({theData: 'this is the data'})}),
    }));

    render(<TestServiceProvider>{thingViewScreen.handler({id: 'some id'}, undefined)}</TestServiceProvider>);

    await waitFor(() => {
      const dataElement = screen.getByText(/this is the data/i);
      expect(dataElement).toBeInTheDocument();
    });
  });

  it('renders not found', async() => {
    apiV0GetExampleDocSpy.mockReturnValue(Promise.resolve({
      acceptStatus: () => ({status: 404, load: () => ({theData: 'this is the data'})}),
    }));

    render(<TestServiceProvider>{thingViewScreen.handler({id: 'some id'}, undefined)}</TestServiceProvider>);

    await waitFor(() => {
      const dataElement = screen.getByText(/item not found/i);
      expect(dataElement).toBeInTheDocument();
    });
  });

  it('renders fetch failed', async() => {
    apiV0GetExampleDocSpy.mockReturnValue(Promise.reject({ }));

    render(<TestServiceProvider>{thingViewScreen.handler({id: 'some id'}, undefined)}</TestServiceProvider>);

    await waitFor(() => {
      const dataElement = screen.getByText(/connection failed/i);
      expect(dataElement).toBeInTheDocument();
    });
  });
});
