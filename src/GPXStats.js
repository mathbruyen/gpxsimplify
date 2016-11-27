'use strict';

import { Transform } from 'stream';
import { haversine } from './utils';

/**
 * Gathers GPX statistics.
 *
 * TODO: output to a stream (process.stdout) instead of to a function
 */
export default class GPXStats extends Transform {

  constructor(options) {
    super(Object.assign({ objectMode : true }, options));
    this._output = options.output;
    this._header = options.header;
    this._segments = [];
  }

  _transform(chunk, encoding, callback) {
    if (chunk.type === 'opensegment') {
      this._segment = { points : 0, distance : 0, last : null };
    } else if (chunk.type === 'closesegment') {
      this._segments.push(this._segment);
      delete this._segment;
    } else if (chunk.type === 'point') {
      this._segment.points++;
      if (this._segment.last) {
        this._segment.distance += haversine(this._segment.last, chunk.point);
      }
      this._segment.last = chunk.point;
    }
    this.push(chunk);
    callback();
  }

  _flush(callback) {
    this._output(this._header);
    this._segments.forEach((segment, idx) => this._output(`${idx}: ${segment.points} points / ${Math.round(segment.distance)}m`));
    callback();
  }

}
