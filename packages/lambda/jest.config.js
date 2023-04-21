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
      branches: 87,
      functions: 69,
      lines: 86,
      statements: 85
    }
  },
  resolver: './jest.resolver.js'
};
