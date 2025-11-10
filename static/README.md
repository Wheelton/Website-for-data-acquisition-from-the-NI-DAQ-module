# Static Files Directory

This directory contains static assets for the web dashboard.

## Adding the Circuit Schematic

To display your circuit schematic on the dashboard:

1. Save your schematic image as `schematic.png` in this directory
2. Supported formats: PNG, JPG, or SVG
3. Recommended size: At least 1200px wide for good clarity

### Current Schema Location
```
static/schematic.png
```

The dashboard will automatically display the schematic at the top of the page. If the image is not found, a placeholder will be shown with instructions.

## Image Requirements
- **Format**: PNG (recommended), JPG, or SVG
- **Size**: Minimum 1200px width recommended
- **File name**: Must be named `schematic.png` (or update the src path in dashboard.html)

