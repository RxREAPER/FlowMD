import * as React from "react";
import type { SVGProps } from "react";

export const FlowName = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
    viewBox="0 0 600 120"
    shapeRendering="crispEdges"
    {...props}
  >
    <text
      x={10}
      y={85}
      fill="currentColor"
      fontFamily="'Pixelify Sans', 'Courier New', monospace"
      fontSize={90}
      fontWeight={700}
      letterSpacing={4}
    >
      {"FLOW"}
    </text>
    <text
      x={350}
      y={85}
      fill="#ff3b5c"
      fontFamily="'Pixelify Sans', 'Courier New', monospace"
      fontSize={90}
      fontWeight={700}
      letterSpacing={4}
    >
      {"MD"}
    </text>
  </svg>
);

export default FlowName;
