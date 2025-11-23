# Hyper-Room Decorator

A web-based 3D room visualization tool with seamless texture generation for interior design simulation.

## Project Structure

```
make_room_glb/
├── frontend/          # React + Three.js 3D viewer
│   ├── src/
│   │   └── RoomTest.jsx
│   └── public/
│       └── tile.glb
│
└── backend/           # FastAPI + OpenCV texture processor
    ├── main.py
    └── requirements.txt
```

## Features

- Multiple room templates (rectangular, L-shaped, corridor, etc.)
- Tile-based texture application for walls and floors
- Seamless texture generation using mirror tiling technique
- Interactive 3D viewer with camera controls
- GLB export for Blender and other 3D software
- Texture atlas optimization to reduce file size

## Quick Start

### 1. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

Backend runs on http://localhost:8000

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on http://localhost:5173

### 3. Usage

1. Open http://localhost:5173 in your browser
2. Select a room template
3. Upload an image (automatically converted to seamless texture)
4. Click tiles to select them
5. Apply the texture to selected tiles
6. Export as GLB file when finished

## How It Works

### Seamless Texture Generation

1. User uploads an image via frontend
2. Frontend sends image to backend API
3. Backend processes using OpenCV:
   - Resize to 128x128
   - Create 4 mirror-flipped tiles
   - Combine into 256x256 seamless texture
   - Apply Gaussian blur at seams
4. Backend returns base64 encoded texture
5. Frontend displays in gallery and applies to tiles

### Texture Atlas Optimization

When exporting GLB files, the system merges all textures per wall surface, reducing the number of textures from 50+ individual tiles to 5-10 merged textures. This significantly reduces file size while maintaining visual quality.

## Technical Stack

### Frontend
- React 18
- Three.js
- React Three Fiber
- React Three Drei
- Vite

### Backend
- FastAPI
- OpenCV
- NumPy
- Pillow

## API Documentation

### GET /
Health check endpoint

### POST /upload-texture
Upload an image and receive a seamless texture

Request:
- Content-Type: multipart/form-data
- Body: file (image file)

Response:
```json
{
  "success": true,
  "texture_url": "data:image/jpeg;base64,...",
  "size": 256
}
```

## AWS Deployment

### Backend

Deploy to EC2 or Elastic Beanstalk. See `backend/README.md` for details.

Quick option (EC2):
```bash
# On EC2 instance
git clone <repository>
cd make_room_glb/backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Frontend

Deploy to S3 + CloudFront or AWS Amplify. See `frontend/README.md` for details.

Quick option (S3):
```bash
cd frontend
npm run build
aws s3 sync dist/ s3://your-bucket-name --acl public-read
```

Remember to update CORS settings in backend and API URL in frontend when deploying.

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

WebGL support required.

## License

MIT
