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

export default class PixivDownloaderCli {
	constructor() {
		this.state = {
			page: 0,
			output: false
		};

		this.spinner = ora({ color: 'red' });
		this.pixiv = new PixivAppApi();
	}

	log() {
		return console.log;
	}

	error() {
		return console.error;
	}

	entry(args) {
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
			this.log(`${pkg.name} ${pkg.version}`);
			return 0;
		}

		if ((args.output || args.o) && args._.length === 0) {
			this.error(chalk.bold.red('ERROR: Invalid arguments'));
			return 1;
		}

		if (args.output || args.o) {
			this.state.output = args.output || args.o;
		} else {
			this.state.output = 'pixiv_downloader_output';
		}

		if (args._.length > 0) {
			const tags = args._.join(' ');
			this.search(tags);
			return 0;
		}

		this.log(`Usage: ${pkg.name} <tag> -o <output>`);
	}

	search(tags) {
		this.spinner.text = 'Getting search results from pixiv';
		this.pixiv.searchIllust(tags).then(json => {
			this.handleSearchResults(json);
		});
	}

	handleSearchResults(json) {
		this.state.page++;
		this.spinner.start();
		this.spinner.text = 'Start Downloading';
		const series = new PromiseSeries();
		json.illusts.forEach(illust => {
			if (illust.metaPages.length === 0) {
				series.add(() =>
					this.download({
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
						this.download({
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
			this.spinner.succeed(`Page ${this.state.page} downloaded successfully`);
			if (this.pixiv.hasNext()) {
				this.spinner.text = 'Getting search results from pixiv';
				this.pixiv.next().then(json => {
					this.handleSearchResults(json);
				});
			} else {
				this.spinner.info('All pages have been downloaded');
			}
		});
	}

	download({ id, url, title, index, length }) {
		const text = `${index + 1}/${length} id${id} ${chalk.bold.underline.blue(
			title
		)}`;
		this.spinner.text = text;
		const output = path.join(this.state.output, `id${id}`);
		mkdirp.sync(output);
		return pixivImg(url, path.join(output, path.basename(url)));
	}
}
