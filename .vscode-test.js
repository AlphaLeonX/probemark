const { defineConfig } = require('@vscode/test-cli');

module.exports = defineConfig({
  files: 'out/test/integration/**/*.test.js',
  workspaceFolder: './test-fixtures/workspace',
  mocha: {
    ui: 'tdd',
    timeout: 20000
  }
});
