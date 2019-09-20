import render from '@dishuostec/scss-cascaded-render';
import { writeFileSync } from 'fs';
import { createFilter } from 'rollup-pluginutils';
import { insertStyle } from './style.js';
import { ensureFileSync } from 'fs-extra/lib/ensure/file.js';

export default function plugin(options = {}) {
  const {
    include = ['**/*.sass', '**/*.scss'],
    exclude = 'node_modules/**',
  } = options;
  const filter = createFilter(include, exclude);
  const insertFnName = '___$insertStyle';
  const styles = [];
  const styleMaps = {};

  options.output = options.output || false;
  options.insert = options.insert || false;

  const { options: renderOptions, ...config } = options;

  return {
    name: 'sass',

    intro() {
      if (options.insert) {
        return insertStyle.toString().replace(/insertStyle/, insertFnName);
      }
    },

    async transform(code, id) {
      if (!filter(id)) {
        return;
      }

      try {
        const res = await render(id, code, config, renderOptions);
        let css = res.css.toString().trim();
        let defaultExport = '';
        let restExports;

        if (css) {
          if (typeof options.processor === 'function') {
            const processResult = await options.processor(css, id);

            if (typeof processResult === 'object') {
              if (typeof processResult.css !== 'string') {
                throw new Error('You need to return the styles using the `css` property. See https://github.com/differui/rollup-plugin-sass#processor');
              }
              css = processResult.css;
              delete processResult.css;
              restExports = Object.keys(processResult).map(name => `export const ${name} = ${JSON.stringify(processResult[name])};`);
            } else if (typeof processResult === 'string') {
              css = processResult;
            }
          }
          if (styleMaps[id]) {
            styleMaps[id].content = css;
          } else {
            styles.push(styleMaps[id] = {
              id: id,
              content: css,
            });
          }
          if (options.insert === true) {
            defaultExport = `${insertFnName}(${JSON.stringify(css)});`;
          } else if (options.output === false) {
            defaultExport = JSON.stringify(css);
          } else {
            defaultExport = `""`;
          }
        }
        return {
          code: [
            `export default ${defaultExport};`,
            ...(restExports || []),
          ].join('\n'),
          map: res.map,
        };
      } catch (error) {
        throw error;
      }
    },

    async generateBundle(generateOptions, bundle, isWrite) {
      if (!options.insert && (!styles.length || options.output === false)) {
        return;
      }
      if (!isWrite) {
        return;
      }

      const css = styles.map(style => style.content).join('');

      if (typeof options.output === 'string') {
        ensureFileSync(options.output, (err) => {
          if (err) {
            throw err;
          }
        });
        return writeFileSync(options.output, css);
      } else if (typeof options.output === 'function') {
        return options.output(css, styles);
      } else if (!options.insert && generateOptions.file && options.output === true) {
        let dest = generateOptions.file;

        if (dest.endsWith('.js') || dest.endsWith('.ts')) {
          dest = dest.slice(0, -3);
        }
        dest = `${dest}.css`;
        ensureFileSync(dest, (err) => {
          if (err) {
            throw err;
          }
        });
        return writeFileSync(dest, css);
      }
    },
  };
}
