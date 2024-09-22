export default {
  testMatch: [
    '**/__tests__/**/*.mjs',
    '**/?(*.)+(spec|mock).mjs'
  ],
  transform: {
    '^.+\\.mjs$': 'babel-jest',
  },
  moduleFileExtensions: ['js', 'mjs'],
};