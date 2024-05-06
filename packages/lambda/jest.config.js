module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  globalSetup: './jest-global-setup.js',
  setupFilesAfterEnv: ['./jest-setup-after-env.js'],
  testMatch: [
    '**/(src|script)/**/?(*.)+(spec).ts'
  ],
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    'script/**/*.{js,ts}',
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/test/',
  ],
  coverageReporters: [
    'text-summary',
    'html',
    'lcovonly'
  ],
  coverageThreshold: {
    global: {
      branches: 77,
      functions: 97,
      lines: 96,
      statements: 97,
    }
  },
  resolver: './jest.resolver.js'
};
