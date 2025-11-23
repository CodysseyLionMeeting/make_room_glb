# 3D Room Builder

A web-based 3D room visualization tool that allows users to design and texture room layouts in the browser. Built with React and Three.js.

## Features

- Multiple room templates (rectangular, L-shaped, etc.)
- Tile-based texture application for walls and floors
- Interactive 3D viewer with camera controls
- GLB export for use in Blender and other 3D software
- Texture atlas optimization to reduce file size
- Client-side processing (no server required)

## Installation

```bash
npm install
```

## Usage

### Development

```bash
npm run dev
```

Open your browser to the URL shown in the terminal (typically http://localhost:5173).

### Build

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Preview

```bash
npm run preview
```

## How to Use

1. Select a room template from the dropdown menu
2. Click on any tile (wall or floor) to select it
3. Upload an image to apply as a texture
4. Adjust tile size if needed
5. Export your room as a GLB file when finished

The GLB file can be imported into Blender, Unity, or other 3D software.

## Technical Details

### Stack

- React 18
- Three.js
- React Three Fiber
- React Three Drei
- Vite

### Optimization

The application implements texture atlas merging per wall surface, which reduces the number of textures from 50+ individual tiles to 5-10 merged textures. This significantly reduces GLB file size while maintaining visual quality.

### Export Format

Exported GLB files include:
- Merged textures per wall surface
- Proper UV coordinate mapping
- Material properties optimized for natural lighting
- Z-axis positioning adjusted for standard 3D workflows

## Browser Compatibility

Tested on modern browsers with WebGL support:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

MIT
