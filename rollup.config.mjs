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
      file: "dist/index.js",
      format: "cjs",
      sourcemap: true,
    },
    {
      file: "dist/index.es.js",
      format: "es",
      sourcemap: true,
    },
    {
      file: "dist/index.min.js",
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
      file: "dist/index.min.es.js",
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
      presets: ["@babel/preset-env", "@babel/preset-react"],
    }),
    postcss({
      plugins: [tailwindcss("./tailwind.config.js")],
      extract: true,
      minimize: true,
    }),
  ],
};
