import React from "react";
import type { ChartProps } from "../types";
import "../styles/global.css";
declare const _default: React.ComponentType<{
    data: any;
    id: string;
    height?: number;
} & Omit<ChartProps, "width" | "height">>;
export default _default;
