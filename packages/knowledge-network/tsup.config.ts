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
  bundle: true,
  globalName: 'KnowledgeNetwork',
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.cjs' : '.js',
    };
  },
  onSuccess: async () => {
    // Fix d3 import placement and corruption in both ESM and CommonJS
    const fixD3Imports = (filePath: string) => {
      try {
        const content = readFileSync(filePath, 'utf8');
        const isCommonJS = filePath.endsWith('.cjs');

        if (isCommonJS) {
          // Fix CommonJS: Replace numbered d3 variables with single d3
          const d3RequireRegex = /var d3\d* = __toESM\(require\("d3"\), 1\);/g;
          const d3Requires = content.match(d3RequireRegex) || [];

          if (d3Requires.length === 0) {
            console.log(`No d3 requires found in ${filePath}`);
            return;
          }

          // Remove all numbered d3 requires
          let fixed = content.replace(d3RequireRegex, '');

          // Replace numbered d3 references (d33, d34, etc.) with d3
          fixed = fixed.replace(/\bd3\d+\b/g, 'd3');

          // Add single d3 require at the top after use strict
          const strictLine = '"use strict";\n';
          if (fixed.startsWith(strictLine)) {
            fixed = strictLine + 'var d3 = __toESM(require("d3"), 1);\n\n' + fixed.slice(strictLine.length);
          } else {
            fixed = 'var d3 = __toESM(require("d3"), 1);\n\n' + fixed;
          }

          // Remove excessive blank lines
          fixed = fixed.replace(/\n{3,}/g, '\n\n');

          writeFileSync(filePath, fixed);
          console.log(`Fixed CommonJS d3 requires in ${filePath} - consolidated to single import`);

        } else {
          // Fix ESM: Handle import statements
          const d3ImportRegex = /^import \* as d3\d* from ["']d3["'];?\s*$/gm;
          const d3Imports = content.match(d3ImportRegex) || [];

          if (d3Imports.length === 0) {
            console.log(`No d3 imports found in ${filePath}`);
            return;
          }

          // Remove all existing d3 imports
          let fixed = content.replace(d3ImportRegex, '');

          // Replace numbered d3 references (d33, d34, etc.) with d3
          fixed = fixed.replace(/\bd3\d+\b/g, 'd3');

          // Add single clean d3 import at the top
          fixed = 'import * as d3 from "d3";\n\n' + fixed;

          // Remove excessive blank lines
          fixed = fixed.replace(/\n{3,}/g, '\n\n');

          writeFileSync(filePath, fixed);
          console.log(`Fixed ESM d3 imports in ${filePath} - moved to top and cleaned up`);
        }
      } catch (error) {
        console.warn(`Could not fix d3 imports in ${filePath}:`, error);
      }
    };

    // Fix both output files
    fixD3Imports(join(process.cwd(), 'dist/index.js'));
    fixD3Imports(join(process.cwd(), 'dist/index.cjs'));
  },
});
