# Reduce gpx size

Build:

```
npm install
npm run build
```

Run:

``
cat input.gpx | npm run simplify -- --frontmatter > output.gpx
```

Options:

* `frontmatter`: ignore [Jekyll frontmatter](http://jekyllrb.com/docs/frontmatter/) on top of the input
