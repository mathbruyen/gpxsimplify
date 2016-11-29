# Reduce gpx size

Build:

```
npm install
npm run build
```

Remove nodes which are less than 10 meters away from the track:

```
node lib/index.js --accuracy 10 < input.gpx > output.gpx
npm run simplify -- --accuracy 10 --in input.gpx --out output.gpx
```

Options:

* `accuracy`: remove points are less than X meters away from the track excluding them
* `in`: input file (otherwise reads from stdin)
* `out`: output file (otherwise writes to stdout)

Features:

* automatically ignores [Jekyll frontmatter](http://jekyllrb.com/docs/frontmatter/) on top of the input

Limitations:

* points must be ordered by time
* handles very few tags (points with elevation and time in unnamed segments)
