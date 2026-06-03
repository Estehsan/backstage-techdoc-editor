/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  extends: [require.resolve('@backstage/cli/config/eslint')],
  rules: {
    'no-warning-comments': ['error', { terms: ['FIXME'], location: 'start' }],
  },
};
