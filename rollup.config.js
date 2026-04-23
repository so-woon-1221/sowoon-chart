import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import terser from '@rollup/plugin-terser';
import babel from '@rollup/plugin-babel';
import webWorkerLoader from 'rollup-plugin-web-worker-loader';

export default {
  input: 'src/index.tsx',
  output: [
    {
      file: 'dist/index.cjs',
      format: 'cjs',
      sourcemap: false,
    },
    {
      file: 'dist/index.esm.js',
      format: 'esm',
      sourcemap: false,
    },
  ],
  plugins: [
    peerDepsExternal(),
    nodeResolve(),
    commonjs(),
    webWorkerLoader({
      targetPlatform: 'browser',
    }),
    typescript({
      tsconfig: './tsconfig.rollup.json',
      compilerOptions: {
        declaration: true,
        declarationDir: './dist/types',
        emitDeclarationOnly: true,
      },
    }),
    babel({
      presets: ['@babel/preset-react'],
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      babelHelpers: 'bundled',
    }),
    terser(),
  ],
  external: ['react', 'react-dom', 'd3'],
};
