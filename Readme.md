# Reduce gpx size

Build:

```
npm install
npm run build
```

Remove nodes which are less than 10 meters away from the track:

``
node lib/index.js --frontmatter --accuracy 10 < input.gpx > output.gpx
```

Options:

* `frontmatter`: ignore [Jekyll frontmatter](http://jekyllrb.com/docs/frontmatter/) on top of the input
* `accuracy`: remove points are less than X meters away from the track excluding them

Limitations:

* points must be ordered by time
* handles very few tags (points with elevation and time in unnamed segments)
