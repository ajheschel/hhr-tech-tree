# Classroom and Poster Printing

## Overview

This fork adds classroom and large-format printing tools to Étienne
Fortier-Dubois's Historical Tech Tree. The normal route keeps the interactive
viewer, while poster routes render the complete technology tree at logical
scale 1 and remove interactive controls from the poster surface.

The available outputs are:

- a continuous full-poster surface for inspection or an external capture
  workflow;
- 11×17-inch portrait panels with compact cards for classroom assembly;
- 96×36-inch panels for a 36-inch roll or large-format printer;
- dated reference panels or date-free student activity panels; and
- automated PDF export of every panel in either print format.

The Historical Tech Tree dataset is not redistributed by this repository.
The viewer requires a local, appropriately obtained data file.

## Prerequisites

- Node.js and npm;
- a local `src/app/api/inventions/techtree-data.json` compatible with the
  upstream application's API route; and
- Chromium installed through Playwright for bulk PDF export.

The data file is intentionally ignored by Git. If you have authorized access
to the upstream data source, the existing upstream data-update tooling can
generate it; otherwise, supply an appropriate local data source. Do not commit
or redistribute the generated JSON from this fork.

## Local setup

Install the JavaScript dependencies:

```bash
npm ci --legacy-peer-deps
```

The legacy peer-dependency flag is currently required because the repository's
React 19 release candidate predates the release candidate accepted by Next
16's declared peer range.

For bulk PDF export, install Playwright's Chromium browser once:

```bash
npx playwright install chromium
```

Place the local data file at:

```text
src/app/api/inventions/techtree-data.json
```

Then start the application:

```bash
npm run dev
```

The examples below assume the app is available at
`http://localhost:3000`. The generated dataset, `.env` files, backups, and
poster PDF output are excluded from source control.

## GitHub Codespaces

This branch includes a small devcontainer based on Node.js 22. To create a
Codespace:

1. Open the repository on the `poster-print` branch on GitHub.
2. Choose **Code → Codespaces → Create codespace on poster-print**.
3. Wait for the container setup and `npm ci --legacy-peer-deps` to finish.

The Codespace intentionally starts without the private Historical Tech Tree
dataset. It does not contact Airtable or download data during setup. Supply
your authorized local copy manually:

1. In the Codespaces Explorer, create the `private-data` directory at the
   repository root if it is not already present.
2. Upload your private `techtree-data.json` into that directory. The entire
   directory is ignored by Git.
3. Install it at the API's expected location:

   ```bash
   ./scripts/install-local-techtree-data.sh private-data/techtree-data.json
   ```

The helper verifies the source file, creates the destination directory if
needed, and copies the file to
`src/app/api/inventions/techtree-data.json`. Both the intake directory and the
destination are ignored by Git. Never force-add either copy.

Start the development server when you are ready:

```bash
npm run dev
```

Open the forwarded port named **Historical Tech Tree** in the Codespaces
**Ports** panel. Codespaces exposes port 3000 through a forwarded browser URL,
not through your own computer's `localhost:3000`. The server is not started
automatically, so the Codespace finishes initialization with a normal shell.

Source changes can be committed and pushed from the Codespace using its normal
Git integration. The dataset remains a manual, private prerequisite and must
not be committed. A rebuilt or newly created Codespace may require the file to
be uploaded and installed again unless you deliberately preserve it somewhere
outside Git.

## Normal interactive mode

Open:

```text
http://localhost:3000/
```

This retains the original interactive presentation: scrolling, zooming,
search, filters, minimap, settings, node selection, and tooltips. The current
branch's shared visibility predicates accept all nodes and connections with
valid positions, so the original viewport culling is not active.

## Full-poster mode

Open:

```text
http://localhost:3000/?poster=1
```

Full-poster mode renders the complete tree as one continuous DOM/SVG document
surface at logical scale 1. The surface width is the calculated tree
`containerWidth`; its height is `TIMELINE_HEIGHT + totalHeight`. The browser
document scrolls across that full surface instead of using the normal
viewport-sized scrolling wrapper. The timeline is placed at the top rather
than made sticky, and search, filters, minimap, zoom controls, settings,
debugging controls, and jump controls are hidden. The introductory box remains
in its normal reserved space.

This route does not add a separate screenshot or raster-export system. It is
the continuous source surface used by the panelized modes and can also be used
with an external capture workflow.

## 11×17 portrait classroom mode

Open a numbered panel with:

```text
http://localhost:3000/?poster=1&format=11x17&panel=1
```

This mode creates an 11×17-inch portrait page with 0.25-inch margins, leaving
a 10.5×16.5-inch poster viewport. The full logical poster height is fitted to
the 16.5-inch usable page height. Horizontal panels have a nominal 0.25-inch
overlap; the overlap can become larger when a boundary is shifted to avoid a
technology card.

The 11×17 layout repacks node Y positions without changing their chronological
X positions or relationships. Its dated cards are 140×140 logical pixels and
use a 60-pixel image, a compact title, a year, and a category-color band. It
removes secondary card information such as subtitles and field labels from
the compact card. Vertical gaps and field-band spacing are reduced to make
the printed text more useful in a classroom.

The preview toolbar shows the current panel and total panel count. Use
**Previous** and **Next** to navigate, or change `panel=1` in the URL. The
**Print** button invokes the browser print dialog for the displayed panel. The
toolbar itself is hidden in print output.

This format prioritizes card readability over minimizing sheet count. Because
the poster is fitted by height, making cards physically more readable can
increase the number of horizontal sheets.

## 36-inch large-format mode

Open:

```text
http://localhost:3000/?poster=1&format=36&panel=1
```

The configured page and usable viewport are both 96×36 inches with no software
margin. The full poster height is fitted to 36 inches, and consecutive panels
have a nominal 0.5-inch overlap. This mode uses the standard poster card layout
rather than the compact 11×17 cards. Navigate and print panels with the same
preview toolbar used by the classroom format.

Confirm that the target roll printer and driver support a 96×36-inch custom
page before printing. Printer hardware margins are outside the application's
control.

## Safe panel boundaries

Panel widths begin with the physical viewport width converted to logical
pixels at the poster's height-fitted scale. The splitter then protects every
technology-card X position by half the active card width plus a small gutter.
Overlapping protected ranges are merged, and the gaps between them become safe
places for page edges.

A panel start is valid only when both its left and right edges fall in safe
gaps. For each following panel, the algorithm chooses the furthest valid start
that still preserves at least the configured overlap. This can shift a panel
earlier and increase its actual overlap. The final panel is realigned, when a
valid position exists, so it covers the poster's right edge while preserving
overlap with the previous panel.

The calculation protects card rectangles horizontally; it does not reroute or
remove connections at page edges. Connections continue across overlapping
panels and can be aligned during assembly. Extremely crowded boundary regions
may require more overlap than the nominal value.

## Bulk PDF export

Keep the local development server running in one terminal:

```bash
npm run dev
```

Then export all 11×17 panels from another terminal:

```bash
npm run export:poster-pdfs -- --format=11x17
```

Or export the 36-inch panels:

```bash
npm run export:poster-pdfs -- --format=36
```

The Playwright script opens Chromium, discovers the panel count from the first
page, waits for the tree, fonts, and visible images, and exports every panel as
a PDF using the application's CSS page size. Files use zero-padded names such
as `panel-001.pdf`.

Default output directories are:

```text
poster-pdfs/11x17/
poster-pdfs/36/
```

Useful options include:

```bash
# Export a range of panels.
npm run export:poster-pdfs -- --format=11x17 --from=5 --to=10

# Use a server running at a different address.
npm run export:poster-pdfs -- --base-url=http://localhost:3001 --format=11x17

# Choose an output directory.
npm run export:poster-pdfs -- --format=11x17 --output-dir=/tmp/tech-tree-panels
```

The exporter creates one PDF per selected panel. `poster-pdfs/` is ignored by
Git, and generated exports must not be committed.

## Date-Free Timeline Activity

Date-free poster mode is activated by adding `dates=0` to a poster URL. For
example, the first classroom panel is:

```text
http://localhost:3000/?poster=1&format=11x17&panel=1&dates=0
```

This removes the timeline's year labels and the year/date badge from every
technology card. In 11×17 mode it also shortens compact cards from 140×140 to
140×120 logical pixels and repacks their Y positions, reducing unused card and
poster height. Full-poster and 36-inch date-free routes hide dates but retain
their standard card geometry.

The activity does not change the underlying years, chronological X positions,
panel sequence, node titles, images, category colors, connections, or
introductory material. Those visual and relational clues remain available to
students. Bulk-export filenames are numbered, so an instructor who wants
students to infer the panel order should shuffle the sheets and conceal or
remove the filenames before distribution.

One possible classroom workflow is:

1. Export the regular dated set as the instructor reference or answer set.
2. Export the date-free set for students.
3. Shuffle the student sheets and ask groups to reconstruct a coherent
   technological timeline using images, titles, categories, and connections.
4. Compare the result with the dated reference set.

Export the complete date-free 11×17 student set with:

```bash
npm run export:poster-pdfs -- --format=11x17 --hide-dates
```

Its default output directory is:

```text
poster-pdfs/11x17-no-dates/
```

The corresponding dated answer/reference set uses the same command without
`--hide-dates`. Date-free 36-inch PDFs are also supported:

```bash
npm run export:poster-pdfs -- --format=36 --hide-dates
```

## Printing tips

- Print a small panel range first and confirm card size, image quality, and
  overlap before exporting or printing the complete set.
- Use the page size and orientation supplied by the application's print CSS:
  11×17 portrait or 96×36 inches, as appropriate.
- Disable browser-generated headers and footers.
- Use 100% or actual-size output rather than an additional “fit to page” step;
  the application has already scaled the logical poster into the configured
  printable viewport.
- Enable background graphics so category colors, images, and the poster
  background are retained.
- Verify that the selected printer and paper support the requested physical
  dimensions.
- Align adjacent sheets using repeated connection lines and the overlap area.

## URLs and modes reference

| Purpose | URL |
| --- | --- |
| Normal interactive viewer | `/?` or `/` |
| Continuous full poster | `/?poster=1` |
| Date-free full poster | `/?poster=1&dates=0` |
| 11×17 panel | `/?poster=1&format=11x17&panel=N` |
| Date-free 11×17 panel | `/?poster=1&format=11x17&panel=N&dates=0` |
| 36-inch panel | `/?poster=1&format=36&panel=N` |
| Date-free 36-inch panel | `/?poster=1&format=36&panel=N&dates=0` |

`poster=1` is required for poster behavior. `format` accepts only `11x17` or
`36`. `panel` is clamped to the available panel range. `dates=0` is effective
only in poster mode.

## Development notes

Technology cards are HTML/DOM elements, while connections are SVG paths. The
panel modes render the same full poster surface and apply a height-derived
print scale plus a horizontal translation for the selected panel. Poster mode
selects every node with valid X/Y coordinates and every connection whose
endpoints have valid coordinates, independent of the normal saved connection
display preference.

The compact 11×17 layout changes card presentation and Y packing only. It
reuses the original chronological X calculation and does not change node
years, timeline mathematics, connection source/target relationships, or the
underlying dataset.

## Automatic upstream synchronization

Upstream is Étienne Fortier-Dubois's
[etiennefd/hhr-tech-tree](https://github.com/etiennefd/hhr-tech-tree). A
GitHub Actions workflow,
[`.github/workflows/sync-poster-print.yml`](.github/workflows/sync-poster-print.yml),
keeps `poster-print` conservatively current with it:

- It checks upstream once a week, Sunday morning Eastern Time, and can also
  be triggered manually from the GitHub Actions tab (**Actions → Sync
  poster-print with upstream → Run workflow**).
- A clean merge is validated — dependency install, TypeScript type-check,
  and a whitespace/conflict-marker check — before anything is pushed.
  `npm run build` and `npm run lint` are intentionally not part of that
  validation: the build script requires live Airtable credentials to
  regenerate the gitignored, copyrighted `techtree-data.json`, which this
  workflow must never fetch or fake; `next lint` is currently broken on
  this branch for reasons unrelated to upstream sync (an ESLint 9 /
  Next.js 16 configuration mismatch), so wiring it in would fail every run
  regardless of merge quality.
- If the merge conflicts, or if install/type-check/diff-check fails, the
  workflow stops without pushing anything. Conflicts and failures require
  manual review; the workflow never attempts automatic conflict
  resolution.
- The workflow never pushes to Étienne's repository, never force-pushes,
  and never rewrites `poster-print` history — only ordinary merge commits
  authored by `github-actions[bot]`.
- Because it only runs weekly (plus whenever you trigger it manually),
  `poster-print` showing up as some commits "behind" upstream between runs
  is normal, not a problem.

The workflow file itself lives on the fork's default branch (`main`)
rather than on `poster-print`. This isn't a preference — GitHub Actions
only evaluates `schedule` triggers (and only shows the manual **Run
workflow** button) for workflow files that exist on the repository's
default branch, regardless of which branch the workflow's own steps check
out and act on. The workflow's steps still target `poster-print`
exclusively.

## Upstream, licensing, and attribution

The original Historical Tech Tree software is by Étienne Fortier-Dubois:
[etiennefd/hhr-tech-tree](https://github.com/etiennefd/hhr-tech-tree).

This fork adds classroom and poster-printing functionality. The original
software remains available under its existing MIT License; see [LICENSE](LICENSE).
The Historical Tech Tree dataset and content are not included in this fork and
remain governed by the upstream project's terms. Users must provide an
appropriate local data source.
