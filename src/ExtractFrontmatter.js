'use strict';

import { Transform } from 'stream';
import { Buffer } from 'buffer';
import { StateMachineBuilder } from './utils';

const HORIZONTAL_TAB = 9;
const LINE_FEED = 10;
const VERTICAL_TAB = 11;
const CARRIAGE_RETURN = 13;
const SPACE = 32;
const HYPHEN = 45;

// Matching $---\s*\n against a buffer
const starting = new StateMachineBuilder('start')
  .addState('start', 'failed')
  .addState('hyphen1', 'failed')
  .addState('hyphen2', 'failed')
  .addState('whitespace', 'failed')
  .addState('matched', 'matched')
  .addState('failed', 'failed')
  .addTransition('start', HYPHEN, 'hyphen1')
  .addTransition('hyphen1', HYPHEN, 'hyphen2')
  .addTransition('hyphen2', HYPHEN, 'whitespace')
  .addTransition('whitespace', HORIZONTAL_TAB, 'whitespace')
  .addTransition('whitespace', VERTICAL_TAB, 'whitespace')
  .addTransition('whitespace', CARRIAGE_RETURN, 'whitespace')
  .addTransition('whitespace', SPACE, 'whitespace')
  .addTransition('whitespace', LINE_FEED, 'matched');

// Matching \n---\s*\n against a buffer
const ending = new StateMachineBuilder('noise')
  .addState('newline', 'noise')
  .addState('hyphen1', 'noise')
  .addState('hyphen2', 'noise')
  .addState('whitespace', 'noise')
  .addState('matched', 'matched')
  .addState('noise', 'noise')
  .addTransition('noise', LINE_FEED, 'newline')
  .addTransition('newline', HYPHEN, 'hyphen1')
  .addTransition('hyphen1', HYPHEN, 'hyphen2')
  .addTransition('hyphen2', HYPHEN, 'whitespace')
  .addTransition('whitespace', HORIZONTAL_TAB, 'whitespace')
  .addTransition('whitespace', VERTICAL_TAB, 'whitespace')
  .addTransition('whitespace', CARRIAGE_RETURN, 'whitespace')
  .addTransition('whitespace', SPACE, 'whitespace')
  .addTransition('whitespace', LINE_FEED, 'matched');

/**
 * Extracts jekyll frontmatter to a different flow than actual content.
 */
export default class ExtractFrontmatter extends Transform {

  constructor(options) {
    super(options);
    this._frontmatter = options.frontmatter;
    this._log = options.log;
    this._starting = starting.build();
    this._pending = Buffer.alloc(0);
  }

  _transform(chunk, encoding, callback) {
    if (this._starting) {
      this._potentialStartingChunk(chunk);
    } else if (this._ending) {
      this._potentialEndingChunk(chunk);
    } else {
      this.push(chunk);
    }
    callback();
  }

  _flush(callback) {
    if (this._ending) {
      this._log('Jekyll frontmatter beginning was found, but not its end');
    }
    if (this._pending) {
      this.push(this._pending);
    }
    callback();
  }

  _potentialStartingChunk(chunk) {
    var matchedIdx = -1;
    var failed = false;
    var onMatch = (buffer, idx, value) => matchedIdx = idx;
    var onFailed = () => failed = true;
    this._starting.once('entermatched', onMatch);
    this._starting.once('enterfailed', onFailed);
    this._starting.read(chunk);
    this._starting.removeListener('entermatched', onMatch);
    this._starting.removeListener('enterfailed', onFailed);
    if (matchedIdx >= 0) {
      this._log('Jekyll frontmatter detected');
      this._frontmatter.write(this._pending);
      this._frontmatter.write(chunk.slice(0, matchedIdx));
      delete this._pending;
      delete this._starting;
      this._ending = ending.build();
      this._potentialEndingChunk(chunk.slice(matchedIdx));
    } else if (failed) {
      this.push(this._pending);
      this.push(chunk);
      delete this._starting;
      delete this._pending;
    } else {
      this._pending = Buffer.concat([this._pending, chunk]);
    }
  }

  _potentialEndingChunk(chunk) {
    var matchedIdx = -1;
    var onMatch = (buffer, idx, value) => matchedIdx = idx;
    this._ending.once('entermatched', onMatch);
    this._ending.read(chunk);
    this._ending.removeListener('entermatched', onMatch);
    if (matchedIdx >= 0) {
      this._frontmatter.write(chunk.slice(0, matchedIdx));
      this.push(chunk.slice(matchedIdx));
      delete this._ending;
    } else {
      this._frontmatter.write(chunk);
    }
  }

}
