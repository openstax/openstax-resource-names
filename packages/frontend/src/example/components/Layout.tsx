import React from 'react';
import { homeScreen } from "../screens/Home";
import { RouteLink } from "../../routing/components/RouteLink";

interface Props {
  title: string;
}

export const Layout = (props: React.PropsWithChildren<Props>) => {

  return <div>
    <nav>
      <ol>
        <li><RouteLink route={homeScreen}>Home</RouteLink></li>
      </ol>
    </nav>
    <h1>{props.title}</h1>
    {props.children}
  </div>;
};
