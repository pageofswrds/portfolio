# Star & constellation data

These data files are from **d3-celestial** by Olaf Frohn:
https://github.com/ofrohn/d3-celestial

Licensed under the **BSD 3-Clause License**, copyright (c) 2015–2019 Olaf Frohn.

Files vendored here:
- `stars.6.json` — star catalog to visual magnitude 6 (RA/Dec, magnitude, HIP id)
- `constellations.lines.json` — the 88 IAU constellation figures as coordinate polylines
- `constellations.json` — constellation names + label positions

They are transformed into `src/sky/sky.generated.ts` by `scripts/build-sky.mjs`
(`npm run build:sky`). Star proper names are applied from a curated map in that
script (the catalog itself carries only magnitudes and HIP ids).
