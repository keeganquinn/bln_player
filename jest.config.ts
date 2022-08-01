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
  moduleNameMapper: {
    '\\.(css)$': '<rootDir>/src/mocks/styleMock.js',
  },
  reporters: [
    'default',
    'jest-junit',
  ],
  roots: [
    'src',
  ],
  testEnvironment: 'jsdom',
  transformIgnorePatterns: [
    'node_modules/?!(spin.js)',
  ],
  preset: 'ts-jest',
  transform: {
    '^.+\\.(ts|tsx)?$': 'ts-jest',
    "^.+\\.(js|jsx)$": "babel-jest",
  }
};
