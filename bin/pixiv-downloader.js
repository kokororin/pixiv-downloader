#!/usr/bin/env node
const cli = require('../lib/cli.js').default;

const exitCode = cli(process.argv.slice(2));

process.on('exit', () => {
	process.exit(exitCode);
});
