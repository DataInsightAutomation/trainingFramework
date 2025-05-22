import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginSass } from '@rsbuild/plugin-sass';
const { generateSvgSprite } = require('./svgPlugin');
import { definePlugin } from '@rsbuild/core';
import type { RsbuildPlugin } from '@rsbuild/core';
import path from 'path';
import fs from 'fs';

const iconPaths = [
  'src',
  // 'src/components/shared/Icon/svgs',
  // 'src/extensions/icons/svgs',
];
const pluginCustomSvgSprite = (options: any = {}): RsbuildPlugin => ({
  name: 'plugin-foo',

  setup(api) {
    const prefix = '';
    const version = Date.now(); // e.g. 1712474283603
    const manifest = {
        sprite: {
            url: `sprite.svg?v=${version}`, // or some version number
            version: `${version}`
        }
    };
    // const manifestPath = path.resolve(__dirname, 'public/manifest_sprite.json');
    const publicDir = path.resolve(__dirname, 'public');
    const spritePrefix = 'sprite-';

    // fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    const outputDir = `${publicDir}/${spritePrefix}${manifest.sprite.version}.svg`;
    const svgoOptions = true; // Enable SVGO optimization
    const symbolIdTemplate = '[name]'; // Symbol ID format
    fs.readdirSync(publicDir).forEach(file => {
      // console.log(path.join(publicDir, file),'path.join(publicDir, file)')
      
      if (file.startsWith(spritePrefix) && file.endsWith('.svg')) {
        console.log(path.join(publicDir, file),'path.join(publicDir, file)')
        fs.unlinkSync(path.join(publicDir, file));
      }
    });
    api.onDevCompileDone(() => {
      generateSvgSprite(iconPaths, outputDir, svgoOptions, symbolIdTemplate, prefix);
    });
    api.onBeforeCreateCompiler(() => 
      generateSvgSprite(iconPaths, outputDir, svgoOptions, symbolIdTemplate, prefix)
    );
  }
});
export default defineConfig({
  resolve: {
    alias: [
      {
        '#': path.resolve(__dirname, 'src'),
        // '#extensions': path.resolve(__dirname, 'src/extensions'),
      },
    ],
    extensions: ['.tsx', '.ts', '.js', '.json', '.html'],
  },
  plugins: [
    pluginReact(), 
    pluginSass(
      {
        sassLoaderOptions: {
          sassOptions: {
            silenceDeprecations: ["legacy-js-api", 'mixed-decls', 'slash-div', 'color-functions', 'import', 'global-builtin'],
            quietDeps: true,
          },
        },
      }
    ),
    pluginCustomSvgSprite()
  ],
  html: {
    template: './public/index.html',
  },
  tools: {
    rspack: (config, { mergeConfig }) => {
      return mergeConfig(config, {
        module: {
          rules: [
            {
              test: /\.md$/,
              type: 'asset/source',
            },
          ],
        },
      });
    },
  },
    server: {
    port: 1234,
  },

});