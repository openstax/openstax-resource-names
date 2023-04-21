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
  coverageReporters: [
    'text-summary',
    'html',
    'lcovonly'
  ],
  coverageThreshold: {
    global: {
      statements: 87,
      branches: 69,
      functions: 86,
      lines: 85,
    }
  },
  resolver: './jest.resolver.js'
};
