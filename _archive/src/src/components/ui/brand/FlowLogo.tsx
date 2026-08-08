import * as React from "react";
import type { SVGProps } from "react";

export const FlowLogo = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
    viewBox="0 0 1600 850"
    shapeRendering="crispEdges"
    {...props}
  >
    <path fill="currentColor" d="M80 100h40v40H80zM140 50h45v45h-45zM40 180h45v45H40zM110 230h40v40h-40z" />
    <path
      fill="none"
      stroke="currentColor"
      strokeWidth={36}
      d="M180 160h460v100H330v150h250v90H330v280H180Z"
    />
    <path
      fill="none"
      stroke="#ff3b5c"
      strokeLinecap="square"
      strokeWidth={30}
      d="M740 270h80v-50h100v50h80v90h-60v90h-50v80h-20v50h-70v-50h-20v-80h-50v-90h-60v-90Z"
    />
    <path
      fill="none"
      stroke="#ff3b5c"
      strokeLinecap="square"
      strokeWidth={34}
      d="M260 450h410l40-120 60 230 50-160 40 50h420"
    />
    <path
      fill="none"
      stroke="#ff3b5c"
      strokeWidth={34}
      d="M1030 160h110l130 230 130-230h110v620h-110V440l-130 220-130-220v340h-110Z"
    />
    <path fill="#ff3b5c" d="M1440 580h45v45h-45z" />
    <path fill="#ff1f46" d="M1510 660h45v45h-45z" />
    <path fill="#ff3b5c" d="M1380 720h40v40h-40zM1560 720h45v45h-45z" />
  </svg>
);

export default FlowLogo;
