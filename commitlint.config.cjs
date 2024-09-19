module.exports = {
  extends: ['@commitlint/config-conventional'],
  ignores: [message => /^Merge branch /.test(message)]
}
