# Pixiv Downloader
[![npm version](https://badge.fury.io/js/pixiv-downloader.svg)](https://badge.fury.io/js/pixiv-downloader)
CLI tool for downloading pixiv search results

## Install
```bash
npm install pixiv-downloader -g
```

## Usage
```bash
pixiv-downloader <tag> -o <outputDir>
```

If you do not provide a output directory, images will be downloader in `pixiv_downloader_output`.  
It will never stop until you kill the terminal manually or all images have been downloaded.

## Example
```bash
pixiv-downloader ことり -o pixiv
```

## License
MIT