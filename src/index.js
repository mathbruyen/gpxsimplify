'use strict';

import minimist from 'minimist';
import ExtractFrontmatter from './ExtractFrontmatter';
import XMLReader from './XMLReader';
import XMLWriter from './XMLWriter';
import GPXReader from './GPXReader';
import GPXWriter from './GPXWriter';
import GPXStats from './GPXStats';

var input = process.stdin;
const argv = minimist(process.argv.slice(2));
const output = process.stdout;

if (argv.frontmatter) {
  input = input.pipe(new ExtractFrontmatter({ frontmatter : output }));
}
input.pipe(new XMLReader())
  .pipe(new GPXReader())
  .pipe(new GPXStats({ header : 'Input statistics:', output : console.error.bind(console) }))
  // TODO simplification goes here
  .pipe(new GPXStats({ header : 'Output statistics:', output : console.error.bind(console) }))
  .pipe(new GPXWriter())
  .pipe(new XMLWriter())
  .pipe(output);
