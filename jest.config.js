module.exports = {
  coverageDirectory: 'coverage-js',
  coverageReporters: [
    'cobertura',
    'html',
    'text',
  ],
  moduleDirectories: [
    'src',
    'node_modules',
  ],
  reporters: [
    'default',
    'jest-junit',
  ],
  roots: [
    'src',
  ],
  transformIgnorePatterns: [
    'node_modules/?!(spin.js)',
  ],
};
