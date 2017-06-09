#!/usr/bin/env node
const PixivDownloaderCli = require('../lib/cli.js').default;

const exitCode = new PixivDownloaderCli().entry(process.argv.slice(2));

process.on('exit', () => {
	process.exit(exitCode);
});
