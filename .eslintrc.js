module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'plugin:react/recommended',
    'airbnb',
    'airbnb-typescript',
    'prettier',
  ],
  overrides: [],
  // parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['react', 'prettier', '@typescript-eslint'],
  rules: {
    // disable props type
    'react/prop-types': 'off',
    // dangle comma ok - typescript
    '@typescript-eslint/comma-dangle': 'off',
    'comma-dangle': 'off',
    // indent off - typescript
    indent: 'off',
    '@typescript-eslint/indent': 'off',
    // @typescript-eslint/member-delimiter-style
    '@typescript-eslint/member-delimiter-style': 'warn',
    // @typescript-eslint/no-non-null-assertion
    '@typescript-eslint/no-non-null-assertion': 'off',
    //import/no-extraneous-dependencies
    'import/no-extraneous-dependencies': 'off',
    //
    'react/function-component-definition': [
      'warn',
      {
        namedComponents: 'arrow-function',
        unnamedComponents: 'arrow-function',
      },
    ],
    'no-underscore-dangle': 'off',
    'react/jsx-props-no-spreading': 'off',
  },
};
