# Agricultural Intervention Intelligence (AII)

AII is a frontend-only Rwanda agricultural intelligence MVP. It presents NISR
evidence through national signals, district profiles, an interactive district
map, an evidence explorer, and a data and methodology view. Observed values,
derived comparisons, and unavailable evidence remain distinct in the interface.

## Run locally

Install the locked dependencies and start the Vite development server:

```sh
npm ci
npm run dev
```

The available project checks are:

```sh
npm run test
npm run typecheck
npm run lint
npm run build
```

`npm run preview` serves the latest production build locally.

## Agricultural data

Original NISR reports are kept in `data/raw/`. The processed observations,
inventory, and source metadata are kept under `data/`; the browser loads the
processed JSON as static assets. `npm run extract:nisr` runs the checked-in
extraction script against the available source reports. Review source values
and provenance before accepting regenerated data.

## Production deployment

`npm run build` creates the static site in `dist/`. Deploy the contents of that
directory to a static hosting platform. The processed JSON assets total about
20 MB uncompressed, so configure the host to serve `.json` files with gzip or
Brotli compression. This repository does not currently include
platform-specific deployment configuration.
