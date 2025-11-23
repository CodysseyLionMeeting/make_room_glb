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

## AWS Deployment

### Option 1: S3 + CloudFront (Recommended)

1. Build the production bundle:
```bash
npm run build
```

2. Create an S3 bucket for static website hosting:
```bash
aws s3 mb s3://your-room-builder-frontend
aws s3 website s3://your-room-builder-frontend --index-document index.html
```

3. Upload the built files:
```bash
aws s3 sync dist/ s3://your-room-builder-frontend --acl public-read
```

4. Create a CloudFront distribution pointing to your S3 bucket for HTTPS and CDN
5. Update the backend API URL in RoomTest.jsx:
```javascript
// Change from
const response = await fetch("http://localhost:8000/upload-texture", {
// To
const response = await fetch("https://your-backend-api-url/upload-texture", {
```

### Option 2: AWS Amplify (Easiest)

1. Install Amplify CLI:
```bash
npm install -g @aws-amplify/cli
amplify configure
```

2. Initialize Amplify in your project:
```bash
amplify init
```

3. Add hosting:
```bash
amplify add hosting
# Select: Hosting with Amplify Console
# Select: Manual deployment
```

4. Build and deploy:
```bash
npm run build
amplify publish
```

5. Amplify will provide a URL where your app is hosted
6. Update the backend API URL as mentioned above

### Environment Variables

For different environments, create a .env file:

```
VITE_API_URL=https://your-backend-api-url
```

Then update the fetch call in RoomTest.jsx:

```javascript
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const response = await fetch(`${API_URL}/upload-texture`, {
```

Remember to rebuild after changing environment variables.

## License

MIT
