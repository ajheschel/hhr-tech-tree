Visit [historicaltechtree.com](https://www.historicaltechtree.com/) to see the tech tree. 

## Classroom / Poster Printing Fork

The `poster-print` branch adds 11×17 portrait classroom printing, 36-inch
large-format printing, compact print cards, card-aware panel boundaries, bulk
PDF export, and a date-free student activity version. See
[POSTER_PRINTING.md](POSTER_PRINTING.md) for setup, URLs, export commands, and
classroom workflows.

The branch also includes a GitHub Codespaces development setup; see the
[Codespaces instructions](POSTER_PRINTING.md#github-codespaces).

## License

**Code**: This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

**Data**: The dataset of technologies and connections, and associated data files, are not covered by the MIT license and remain under copyright. All rights reserved.

## Development notes

To run the app on http://localhost:3000, run `npm run dev`

The data on inventions and connections is updated automatically upon deployment to Vercel. To update during development, run
`./update-data.sh`
This:
- runs the image update script (see below) with argument `--new`
- runs the script `src/scripts/fetch-and-save-inventions.ts` to create the JSON data, taking care of dependencies first.

To update the images (automatically part of the update script above for new techs):
- run `python src/scripts/update_images.py --new` (if adding image to recently added techs) or `--all` (if updating all images)
- Then commit the updated images
- This script automatically updates the image credits as well (which will appear once the fetch-and-save script is re-run)
- You can only update the credits, not the images, by adding the argument `--credits-only`
