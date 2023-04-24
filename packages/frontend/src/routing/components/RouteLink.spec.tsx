import { render, screen, fireEvent } from '@testing-library/react';
import { createRouteLink } from "./RouteLink";
import { TestServiceProvider, testServices } from "../../tests/testServices";
import { createRoute } from "../../core/services";

const testRoute = createRoute({name: 'TestScreen', path: '/', handler: () => <div />});
const testPropsRoute = createRoute({
  name: 'TestPropsScreen',
  path: '/:prop',
  handler: (props: {prop: string}) => <div />
});

type RouteUnion = (typeof testRoute) | (typeof testPropsRoute);

const RouteLink = createRouteLink<RouteUnion>();

describe('RouteLink', () => {
  it('renders a link', () => {
    render(<TestServiceProvider><RouteLink route={testRoute}>link text</RouteLink></TestServiceProvider>);
    expect(screen.getByText(/link text/i)).toMatchInlineSnapshot(`
<a
  href="/"
>
  link text
</a>
`);
  });

  it('renders a link with props', () => {
    render(<TestServiceProvider>
      <RouteLink route={testPropsRoute} params={{prop: 'value'}}>link text</RouteLink>
    </TestServiceProvider>);
    expect(screen.getByText(/link text/i)).toMatchInlineSnapshot(`
<a
  href="/value"
>
  link text
</a>
`);
  });

  it('pushes history', () => {
    render(
      <TestServiceProvider>
        <RouteLink route={testPropsRoute} params={{prop: 'value'}}>link text</RouteLink>
      </TestServiceProvider>
    );

    const pushSpy = jest.spyOn(testServices.history, 'push');

    fireEvent.click(screen.getByText(/link text/i));

    expect(pushSpy).toHaveBeenCalledWith('/value');
  });
});
