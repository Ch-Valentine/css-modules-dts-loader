const fs = require('fs');
const path = require('path');
const compileProject = require('./compiler');

describe('css-modules-dts-loader', () => {
  // Helper function to read file content
  const readFile = (dir, file) => {
    return fs.readFileSync(path.join(dir, file), 'utf8');
  };

  // Helper function to check if file exists
  const fileExists = (dir, file) => {
    return fs.existsSync(path.join(dir, file));
  };

  // Helper function to normalize line endings
  const normalizeLineEndings = (text) => {
    return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  };

  describe('Basic Functionality', () => {
    it('should generate .d.ts file for CSS modules', async () => {
      const files = {
        'index.js': `import styles from './styles.module.css';`,
        'styles.module.css': `.validClass { color: blue; }`
      };

      const { tmpDir } = await compileProject({ files });

      expect(fileExists(tmpDir, 'styles.module.css.d.ts')).toBe(true);

      const dtsContent = readFile(tmpDir, 'styles.module.css.d.ts');
      expect(normalizeLineEndings(dtsContent)).toMatchSnapshot();
    });

    it('should handle empty CSS files', async () => {
      const files = {
        'index.js': `import styles from './empty.module.css';`,
        'empty.module.css': ``
      };

      const { tmpDir } = await compileProject({ files });

      expect(fileExists(tmpDir, 'empty.module.css.d.ts')).toBe(true);

      const dtsContent = readFile(tmpDir, 'empty.module.css.d.ts');
      expect(normalizeLineEndings(dtsContent)).toMatchSnapshot();
    });
  });

  describe('Options: camelCase', () => {
    it('should convert kebab-case class names to camelCase', async () => {
      const files = {
        'index.js': `import styles from './styles.module.css';`,
        'styles.module.css': `.kebab-case-class { color: blue; }`
      };

      const { tmpDir } = await compileProject({
        files,
        loaderOptions: { camelCase: true }
      });

      const dtsContent = readFile(tmpDir, 'styles.module.css.d.ts');
      expect(normalizeLineEndings(dtsContent)).toMatchSnapshot();
    });
  });

  describe('Options: quote', () => {
    it('should use single quotes when specified', async () => {
      const files = {
        'index.js': `import styles from './styles.module.css';`,
        'styles.module.css': `.testClass { color: blue; }`
      };

      const { tmpDir } = await compileProject({
        files,
        loaderOptions: { quote: 'single' }
      });

      const dtsContent = readFile(tmpDir, 'styles.module.css.d.ts');
      expect(normalizeLineEndings(dtsContent)).toMatchSnapshot();
    });
  });

  describe('Options: indentStyle and indentSize', () => {
    it('should use tabs for indentation when specified', async () => {
      const files = {
        'index.js': `import styles from './styles.module.css';`,
        'styles.module.css': `.testClass { color: blue; }`
      };

      const { tmpDir } = await compileProject({
        files,
        loaderOptions: { indentStyle: 'tab' }
      });

      const dtsContent = readFile(tmpDir, 'styles.module.css.d.ts');
      expect(normalizeLineEndings(dtsContent)).toMatchSnapshot();
    });

    it('should use custom space indentation size when specified', async () => {
      const files = {
        'index.js': `import styles from './styles.module.css';`,
        'styles.module.css': `.testClass { color: blue; }`
      };

      const { tmpDir } = await compileProject({
        files,
        loaderOptions: { indentStyle: 'space', indentSize: 4 }
      });

      const dtsContent = readFile(tmpDir, 'styles.module.css.d.ts');
      expect(normalizeLineEndings(dtsContent)).toMatchSnapshot();
    });
  });

  describe('Options: mode', () => {
    it('should verify valid declaration file in verify mode', async () => {
      const dtsContent = [
        '// This file is automatically generated.',
        '// Please do not change this file!',
        'export const testClass: string;',
        ''
      ].join('\n');

      const files = {
        'index.js': `import styles from './styles.module.css';`,
        'styles.module.css': `.testClass { color: blue; }`,
        'styles.module.css.d.ts': dtsContent
      };

      await expect(compileProject({
        files,
        loaderOptions: { mode: 'verify' }
      })).resolves.toBeDefined();
    });

    it('should fail verification with invalid declaration file', async () => {
      const invalidDtsContent = [
        '// This file is automatically generated.',
        '// Please do not change this file!',
        'interface CssExports {',
        '  "wrongClass": string;',
        '}',
        '',
        'export const cssExports: CssExports;',
        'export default cssExports;',
        ''
      ].join('\n');

      const files = {
        'index.js': `import styles from './styles.module.css';`,
        'styles.module.css': `.testClass { color: blue; }`,
        'styles.module.css.d.ts': invalidDtsContent
      };

      await expect(compileProject({
        files,
        loaderOptions: { mode: 'verify' }
      })).rejects.toThrow();
    });
  });

  describe('Options: sort', () => {
    it('should sort class names alphabetically when enabled', async () => {
      const files = {
        'index.js': `import styles from './styles.module.css';`,
        'styles.module.css': `
          .zebra { color: black; }
          .alpha { color: blue; }
          .beta { color: green; }
        `
      };

      const { tmpDir } = await compileProject({
        files,
        loaderOptions: { sort: true }
      });

      const dtsContent = readFile(tmpDir, 'styles.module.css.d.ts');
      expect(normalizeLineEndings(dtsContent)).toMatchSnapshot();
    });
  });

  describe('Options: namedExport', () => {
    it('should generate named exports when namedExport is true', async () => {
      const files = {
        'index.js': `import styles from './styles.module.css';`,
        'styles.module.css': `
          .zebra { color: black; }
          .alpha { color: blue; }
          .beta { color: green; }
        `
      };

      const { tmpDir } = await compileProject({
        files,
        loaderOptions: { namedExport: true }
      });

      const dtsContent = readFile(tmpDir, 'styles.module.css.d.ts');
      expect(normalizeLineEndings(dtsContent)).toMatchSnapshot();
    });

    it('should generate interface export when namedExport is false', async () => {
      const files = {
        'index.js': `import styles from './styles.module.css';`,
        'styles.module.css': `
          .zebra { color: black; }
          .alpha { color: blue; }
          .beta { color: green; }
        `
      };

      const { tmpDir } = await compileProject({
        files,
        loaderOptions: { namedExport: false }
      });

      const dtsContent = readFile(tmpDir, 'styles.module.css.d.ts');
      expect(normalizeLineEndings(dtsContent)).toMatchSnapshot();
    });
  });
});
