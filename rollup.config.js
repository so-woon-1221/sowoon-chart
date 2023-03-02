const babel = require("rollup-plugin-babel");
const resolve = require("rollup-plugin-node-resolve");
const commonjs = require("rollup-plugin-commonjs");
const { terser } = require("rollup-plugin-terser");
const peerDepsExternal = require("rollup-plugin-peer-deps-external");
const typescript = require("rollup-plugin-typescript2");
const postcss = require("rollup-plugin-postcss");
const tailwindcss = require("tailwindcss");
const multiInput = require("rollup-plugin-multi-input").default;

module.exports = {
  input: "lib/**/*.tsx",
  output: [
    {
      // file: "dist/index.js",
      dir: "src",
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
      // file: "dist/index.mjs",
      dir: "dist",
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
    multiInput({ relative: "lib" }),
    peerDepsExternal(),
    resolve(),
    commonjs(),
    typescript({
      tsconfig: "tsconfig.json",
    }),
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
  external: [
    "react",
    "react-dom",
    // "d3",
    "d3-scale",
    "d3-shape",
    "d3-array",
    "d3-selection",
    "d3-axis",
    "d3-brush",
    "@visx/tooltip",
    "@visx/responsive",
    "@visx/clip-path",
    "@visx/pattern",
    "d3-cloud",
  ],
};
