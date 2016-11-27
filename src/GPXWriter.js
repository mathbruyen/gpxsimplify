'use strict';

import { Transform } from 'stream';

/**
 * GPX writer.
 */
export default class GPXWriter extends Transform {

  constructor(options) {
    super(Object.assign({ objectMode : true }, options));
    this._started = false;
  }

  _transform(chunk, encoding, callback) {
    if (!this._started) {
      this._start();
      this._started = true;
    }
    if (chunk.type === 'opensegment') {
      this.push({ type : 'opentag', name : 'trkseg' });
    } else if (chunk.type === 'closesegment') {
      this.push({ type : 'closetag', name : 'trkseg' });
    } else if (chunk.type === 'point') {
      this.push({
        type : 'opentag',
        name : 'trkpt',
        attributes : { lat : chunk.point.lat.toString(), lon : chunk.point.lon.toString() }
      });
      if (chunk.point.ele) {
        this.push({ type : 'opentag', name : 'ele' });
        this.push({ type : 'text', text : chunk.point.ele.toString() });
        this.push({ type : 'closetag', name : 'ele' });
      }
      if (chunk.point.time) {
        this.push({ type : 'opentag', name : 'time' });
        this.push({ type : 'text', text : (new Date(chunk.point.time)).toISOString() });
        this.push({ type : 'closetag', name : 'time' });
      }
      this.push({ type : 'closetag', name : 'trkpt' });
    }
    callback();
  }

  _flush(callback) {
    this.push({ type: 'closetag', name : 'trk' });
    this.push({ type: 'closetag', name : 'gpx' });
    callback();
  }

  _start() {
    this.push({ type : 'processinginstruction', name : 'xml', body : 'version="1.0" encoding="utf-8"' });
    this.push({
      type : 'opentag',
      name : 'gpx',
      attributes : {
        'xmlns:xsi' : 'http://www.w3.org/2001/XMLSchema-instance',
        'xsi:schemaLocation' : 'http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd',
        version : '1.1',
        xmlns : 'http://www.topografix.com/GPX/1/1'
      }
    });
    this.push({ type: 'opentag', name : 'trk' });
  }

}
