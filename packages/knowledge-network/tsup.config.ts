import { defineConfig } from 'tsup';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: false,
  minify: false,
  external: ['d3'],
  globalName: 'KnowledgeNetwork',
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.cjs' : '.js',
    };
  },
  onSuccess: async () => {
    // Post-build fix for d3 import name corruption
    const fixD3Imports = (filePath: string) => {
      try {
        const content = readFileSync(filePath, 'utf8');
        // Replace all d3X import names with d3
        const fixed = content
          .replace(/import \* as d3\d+ from "d3";/g, '')
          .replace(/\bd3\d+\b/g, 'd3')
          .replace(/^/, 'import * as d3 from "d3";\n');
        writeFileSync(filePath, fixed);
        console.log(`Fixed d3 imports in ${filePath}`);
      } catch (error) {
        console.warn(`Could not fix d3 imports in ${filePath}:`, error);
      }
    };

    // Fix both output files
    fixD3Imports(join(process.cwd(), 'dist/index.js'));
    fixD3Imports(join(process.cwd(), 'dist/index.cjs'));
  },
});
