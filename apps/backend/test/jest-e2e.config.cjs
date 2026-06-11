module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  setupFiles: ['<rootDir>/set-env.cjs'],
  testEnvironment: 'node',
  testRegex: '.e2e-spec.ts$',
  moduleNameMapper: {
    '^puppeteer$': '<rootDir>/mocks/puppeteer.cjs',
  },
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', {}],
  },
};
