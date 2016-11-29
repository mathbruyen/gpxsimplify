'use strict';

import minimist from 'minimist';
import ExtractFrontmatter from './ExtractFrontmatter';
import XMLReader from './XMLReader';
import XMLWriter from './XMLWriter';
import GPXReader from './GPXReader';
import GPXWriter from './GPXWriter';
import GPXStats from './GPXStats';
import GPXSimplify from './GPXSimplify';
import { createReadStream, createWriteStream } from 'fs';

const argv = minimist(process.argv.slice(2));
const input = argv.in ? createReadStream(argv.in, { encoding : 'utf-8' }) : process.stdin;
const output = argv.out ? createWriteStream(argv.out, { defaultEncoding : 'utf-8' }) : process.stdout;
const log = argv.out ? console.error.bind(console) : console.log.bind(console);

input.pipe(new ExtractFrontmatter({ frontmatter : output, log }))
  .pipe(new XMLReader())
  .pipe(new GPXReader())
  .pipe(new GPXStats({ header : 'Input statistics:', output : log }))
  .pipe(new GPXSimplify({ accuracy : argv.accuracy }))
  .pipe(new GPXStats({ header : 'Output statistics:', output : log }))
  .pipe(new GPXWriter())
  .pipe(new XMLWriter())
  .pipe(output);

// TODO handle on('error')
