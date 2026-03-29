export default {
  testMatch: [
    '**/__tests__/**/*.mjs',
    '**/?(*.)+(spec|mock).mjs'
  ],
  transform: {
    '^.+\\.[jm]js$': 'babel-jest',
  },
  moduleFileExtensions: ['js', 'mjs'],
};
