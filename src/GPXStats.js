'use strict';

import { Transform } from 'stream';

/**
 * Gathers GPX statistics.
 *
 * TODO: measure distance
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
      this._segment = { points : 0 };
    } else if (chunk.type === 'closesegment') {
      this._segments.push(this._segment);
      delete this._segment;
    } else if (chunk.type === 'point') {
      this._segment.points++;
    }
    this.push(chunk);
    callback();
  }

  _flush(callback) {
    this._output(this._header);
    this._segments.forEach((segment, idx) => this._output(`${idx}: ${segment.points} points`));
    callback();
  }

}
