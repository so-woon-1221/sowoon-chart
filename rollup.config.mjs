import babel from "rollup-plugin-babel";
import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import { terser } from "rollup-plugin-terser";
import peerDepsExternal from "rollup-plugin-peer-deps-external";
import typescript from "rollup-plugin-typescript2";
import postcss from "rollup-plugin-postcss";
import tailwindcss from "tailwindcss";

const extensions = [".js", ".jsx", ".ts", ".tsx"];

export default {
  input: "lib/index.tsx",
  output: [
    {
      file: "dist/index.cjs",
      format: "cjs",
      sourcemap: true,
      plugins: [
        terser({
          mangle: false,
          compress: {
            drop_console: true,
          },
        }),
      ],
    },
    {
      file: "src/index.mjs",
      format: "es",
      sourcemap: true,
      plugins: [
        terser({
          mangle: false,
          compress: {
            drop_console: true,
          },
        }),
      ],
    },
    // {
    //   file: "src/index.js",
    //   format: "umd",
    //   name: "sowoon-chart",
    //   sourcemap: true,
    // },
    // {
    //   file: "dist/index.min.cjs",
    //   format: "cjs",
    //   sourcemap: true,
    //   plugins: [
    //     terser({
    //       mangle: false,
    //       compress: {
    //         drop_console: true,
    //       },
    //     }),
    //   ],
    // },
    // {
    //   file: "dist/index.min.es.mjs",
    //   format: "es",
    //   sourcemap: true,
    //   plugins: [
    //     terser({
    //       mangle: false,
    //       compress: {
    //         drop_console: true,
    //       },
    //     }),
    //   ],
    // },
  ],
  plugins: [
    peerDepsExternal(),
    typescript({
      tsconfig: "tsconfig.json",
    }),
    commonjs(),
    resolve({ extensions }),
    babel({
      exclude: "node_modules/**",
      presets: [
        ["@babel/preset-env", { targets: { node: "current" } }],
        "@babel/preset-react",
        "@babel/preset-typescript",
      ],
      plugins: [["@babel/plugin-transform-runtime", { useESModules: true }]],
    }),
    postcss({
      plugins: [tailwindcss("./tailwind.config.cjs")],
      extract: true,
      minimize: true,
    }),
  ],
  external: ["react", "react-dom", "d3", "@visx/visx"],
};
