import path from 'path';
import fs from 'fs';
import PixivAppApi from 'pixiv-app-api';
import pixivImg from 'pixiv-img';
import mkdirp from 'mkdirp';
import yargs from 'yargs';
import ora from 'ora';
import chalk from 'chalk';
import PromiseSeries from 'promise-series';
import pkg from '../package.json';

const spinner = ora({ color: 'red' });
const pixiv = new PixivAppApi();
const log = console.log;
const error = console.error;
const initialState = {
	page: 0,
	output: false
};

export default function cli(args) {
	if (typeof args === 'undefined') {
		return 1;
	}

	if (typeof args === 'object') {
		args = args.join(' ');
	}

	if (typeof args !== 'string') {
		return 1;
	}

	args = yargs(args)
		.describe('output', 'Output file')
		.describe('version', 'Print version number and exit')
		.help('help')
		.alias('o', 'output')
		.alias('h', 'help')
		.alias('v', 'version').argv;

	if (args.version || args.v) {
		const json = require('./package.json');
		log(`${pkg.name} ${pkg.version}`);
		return 0;
	}

	if ((args.output || args.o) && args._.length === 0) {
		error(chalk.bold.red('ERROR: Invalid arguments'));
		return 1;
	}

	if (args.output || args.o) {
		initialState.output = args.output || args.o;
	} else {
		initialState.output = 'pixiv_downloader_output';
	}

	if (args._.length > 0) {
		const tags = args._.join(' ');
		search(tags);
		return 0;
	}

	log(`Usage: ${pkg.name} <tag> -o <output>`);
}

function search(tags) {
	pixiv.searchIllust(tags).then(json => {
		handleSearchResults(json);
	});
}

function handleSearchResults(json) {
	initialState.page++;
	spinner.start();
	spinner.text = 'Start Downloading';
	const series = new PromiseSeries();
	json.illusts.forEach(illust => {
		if (illust.metaPages.length === 0) {
			series.add(() =>
				download({
					id: illust.id,
					url: illust.imageUrls.large,
					title: illust.title,
					index: 0,
					length: 1
				})
			);
		} else {
			illust.metaPages.forEach((metaPage, index) => {
				series.add(() =>
					download({
						id: illust.id,
						url: metaPage.imageUrls.original,
						title: illust.title,
						index,
						length: illust.metaPages.length
					})
				);
			});
		}
	});
	series.run().then(() => {
		spinner.succeed(`Page ${initialState.page} downloaded successfully`);
		if (pixiv.hasNext()) {
			pixiv.next().then(json => {
				handleSearchResults(json);
			});
		} else {
			spinner.info('All pages have been downloaded');
		}
	});
}

function download({ id, url, title, index, length }) {
	const text = `${index + 1}/${length} id${id} ${chalk.bold.underline.blue(
		title
	)}`;
	spinner.text = text;
	const output = path.join(initialState.output, `id${id}`);
	mkdirp.sync(output);
	return pixivImg(url, path.join(output, path.basename(url)));
}
