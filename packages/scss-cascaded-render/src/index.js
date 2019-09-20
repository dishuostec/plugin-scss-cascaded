import fs from 'fs';
import path from 'path';
import sass from 'sass';

function findIncludePath(file, additional) {
  return [
    file.length && path.dirname(file),
    process.cwd(),
    path.resolve(process.cwd(), 'node_modules'),
  ]
    .concat(additional)
    .filter(Boolean);
};

function findDefineFiles(file, config) {
  const { defineFile = '_define.scss', root = process.cwd() } = config;

  const relativePath = path.relative(root, path.dirname(file));

  // todo: use \ on windows
  return ['.']
    .concat(relativePath.split('/'))
    .map((dir, i, arr) => path.resolve(root, arr.slice(0, i + 1).join('/'), defineFile))
    .filter(fs.existsSync);
};

const combineData = (renderOptionData, defineFile, source) => {
  return [
    renderOptionData,
    defineFile.map(file => `@import "${file}";`),
    source,
  ].flat(Infinity)
    .filter(Boolean)
    .join('\n');
};

export default async function render(file, source, config = {}, renderOptions = {}) {
  const defineFiles = findDefineFiles(file, config);
  const includePaths = findIncludePath(file, renderOptions.includePaths);
  const data = combineData(renderOptions.data, defineFiles, source);

  return await sass.renderSync({
    sourceMap: true,
    ...renderOptions,
    data,
    includePaths,
    outFile: 'x', // this is necessary, but is ignored
  });
}
