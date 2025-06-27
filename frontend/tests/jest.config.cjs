module.exports = {
  testEnvironment: 'jsdom',
  rootDir: '../.',
  testMatch: ['<rootDir>/tests/jest/*.test.{js,jsx}'],
  setupFilesAfterEnv: ['<rootDir>/tests/jest/jest.setup.js'],
  moduleDirectories: ['node_modules', '<rootDir>/node_modules'],
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },
  moduleNameMapper: {
    '\\.(css|less|scss)$': 'identity-obj-proxy', // ignore css
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};
