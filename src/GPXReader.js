'use strict';

import { Transform } from 'stream';

/**
 * GPX reader as object stream.
 *
 * TODO: handle invalid states
 */
export default class GPXReader extends Transform {

  constructor(options) {
    super(Object.assign({ objectMode : true }, options));
  }

  _transform(chunk, encoding, callback) {
    if (chunk.type === 'opentag' && chunk.name == 'trkseg') {
      this.push({ type : 'opensegment' });
    } else if (chunk.type === 'closetag' && chunk.name == 'trkseg') {
      this.push({ type : 'closesegment' });
    } else if (chunk.type === 'opentag' && chunk.name == 'trkpt') {
      this._point = { lat : parseFloat(chunk.attributes.lat), lon : parseFloat(chunk.attributes.lon) };
    } else if (chunk.type === 'closetag' && chunk.name == 'trkpt') {
      this.push({ type : 'point', point : this._point });
    } else if (chunk.type === 'opentag' && chunk.name == 'ele') {
      this._readingElevation = true;
    } else if (chunk.type === 'text' && this._readingElevation) {
      this._point.ele = parseFloat(chunk.text);
      delete this._readingElevation;
    } else if (chunk.type === 'opentag' && chunk.name == 'time') {
      this._readingTime = true;
    } else if (chunk.type === 'text' && this._readingTime) {
      this._point.time = Date.parse(chunk.text);
      delete this._readingTime;
    }
    callback();
  }

}
