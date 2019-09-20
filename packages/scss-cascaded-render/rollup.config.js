import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import pkg from './package.json';

export default [
  {
    input: './src/index.js',
    output: [
      { format: 'cjs', file: pkg.main },
      { format: 'esm', file: pkg.module },
    ],
    plugins: [
      resolve(),
      commonjs(),
    ],
    external: [
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.peerDependencies || {}),
      ...(require('module').builtinModules || Object.keys(process.binding('natives'))),
    ],
  },
];
