import React from "react";
import { ComponentType } from "react";
declare const withParentSize: <P extends {
    data: any;
    id: string;
    height?: number;
}>(ChartComponent: React.ComponentType<P>) => React.ComponentType<{
    data: any;
    id: string;
    height?: number;
} & Omit<P, "width" | "height">>;
export default withParentSize;
