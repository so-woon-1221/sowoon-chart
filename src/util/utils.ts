import { type ForwardedRef } from "react";

export function mergeRefs<T>(...refs: ForwardedRef<T>[]) {
  return (node: T) => {
    refs.forEach((ref) => {
      if (ref && typeof ref !== "function") {
        ref.current = node;
      }
    });
  };
}
