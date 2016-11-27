'use strict';

import { Transform } from 'stream';
import { haversine } from './utils';

/**
 * Simplify GPS by removing predictable points.
 */
export default class GPXSimplify extends Transform {

  constructor(options) {
    super(Object.assign({ objectMode : true }, options));
    this._accuracy = options.accuracy;
  }

  _transform(chunk, encoding, callback) {
    if (chunk.type === 'opensegment') {
      this.push(chunk);
    } else if (chunk.type === 'closesegment') {
      if (this._candidate) {
        this.push({ type : 'point', point : this._candidate });
        delete this._candidate;
      }
      delete this._skipped;
      delete this._start;
      this.push(chunk);
    } else if (chunk.type === 'point') {
      if (!chunk.point.time) {
        // TODO ignoring points without time
        this.push(chunk);
      } else if (!this._start) {
        this._start = chunk.point;
        this.push(chunk);
      } else if (!this._candidate) {
        this._skipped = [];
        this._candidate = chunk.point;
      } else if (this._canReplaceCandidate(chunk.point)) {
        this._skipped.push(this._candidate);
        this._candidate = chunk.point;
      } else {
        this.push({ type : 'point', point : this._candidate });
        this._start = this._candidate;
        this._skipped = [];
        this._candidate = chunk.point;
      }
    }
    callback();
  }

  _canReplaceCandidate(point) {
    const predicts = this._predicts.bind(this, point);
    return this._skipped.every(predicts) && predicts(this._candidate);
  }

  _predicts(final, intermediate) {
    return haversine(intermediate, this._predict(final, intermediate.time)) < this._accuracy;
  }

  _predict(final, time) {
    return {
      lat : this._interpolate(this._start.time, final.time, time, this._start.lat, final.lat),
      lon : this._interpolate(this._start.time, final.time, time, this._start.lon, final.lon),
      ele : this._interpolate(this._start.time, final.time, time, this._start.ele, final.ele),
      time
    };
  }

  _interpolate(startTime, endTime, time, startValue, endValue) {
    return startValue + (endValue - startValue) * (time - startTime) / (endTime - startTime);
  }

}
