import babel from "@rollup/plugin-babel";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";

export default [
  {
    input: "src/init.js",
    output: {
      file: "dist/weblights.min.js",
      format: "iife",
    },
    plugins: [
      babel({
        exclude: "node_modules/**",
        babelHelpers: "bundled",
      }),
      nodeResolve(),
      //terser(),
    ],
  },
];
