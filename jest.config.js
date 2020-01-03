module.exports = {
  coverageDirectory: 'coverage-js',
  coverageReporters: [
    'cobertura',
    'html',
    'text',
  ],
  moduleDirectories: [
    'lib',
    'node_modules',
  ],
  reporters: [
    'default',
    'jest-junit',
  ],
  roots: [
    'lib',
  ],
  transformIgnorePatterns: [
    'node_modules/?!(spin.js)',
  ],
};
