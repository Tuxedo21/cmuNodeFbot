const program = require('commander')
program
  .version('0.5.0')
  .option('-i, --interactive', 'Run in command-line interactive mode')
  .parse(process.argv)

module.exports = program