module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  globalSetup: './jest-global-setup.js',
  testMatch: [
    '**/src/**/?(*.)+(spec).ts'
  ],
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
  ],
  coverageReporters: [
    'text-summary',
    'html',
    'lcovonly'
  ],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    }
  },
  resolver: './jest.resolver.js'
};
