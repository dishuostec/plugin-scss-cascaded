import render from '@dishuostec/scss-cascaded-render';

const ignoreType = (type) => {
  if (!type) {
    return true;
  }
  type = type.replace(/^\w+\//g, '');
  return type !== 'scss' && type !== 'sass';
};

export default function sveltePreprocessScss(options = {}) {
  const { options: renderOptions, ...config } = options;

  return {
    style: async ({ content, attributes, filename }) => {
      if (ignoreType(attributes.type)) {
        return;
      }

      const result = await render(filename, content, config, renderOptions);

      return {
        code: result.css.toString(),
        map: result.map ? result.map.toString() : undefined,
        dependencies: result.stats.includedFiles,
      };

    },
  };
};


