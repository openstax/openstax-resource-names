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
  resolver: './jest.resolver.js'
};
