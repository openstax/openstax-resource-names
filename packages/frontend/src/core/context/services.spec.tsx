import React from 'react';
import { render, screen } from '@testing-library/react';
import { ServiceContext, serviceProviderMiddleware } from "./services";
import { AppServices } from "../types";

afterEach(() => {
  jest.resetAllMocks();
});

describe('ServicesContext', () => {
  it('throws without a provider', () => {
    jest.spyOn(console, 'error').mockReturnValue(undefined);

    const Test = () => {
      React.useContext(ServiceContext)();

      return <div />;
    };

    expect(() => render(<Test />)).toThrow();
  });
});

describe('serviceProviderMiddleware', () => {
  it('provides services', () => {
    const services = {text: 'cool text'} as any as AppServices;

    const InnerTest = () => {
      const services = React.useContext(ServiceContext)();
      return <span>{(services as any).text}</span>;
    };
    const Test = () => <>{serviceProviderMiddleware(services)(<InnerTest />)}</>;

    render(<Test />);

    const textElement = screen.getByText(/cool text/i);
    expect(textElement).toBeInTheDocument();
  });
});
