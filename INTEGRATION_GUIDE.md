# Integration Guide: Frontend + Backend

This guide explains how to run the complete Hyper-Room Decorator application with frontend and backend integration.

## Project Structure

```
term_project/
├── make_room_glb/              # Frontend (React + Three.js)
│   ├── src/
│   │   ├── RoomTest.jsx
│   │   └── main.jsx
│   ├── public/
│   │   └── tile.glb
│   └── package.json
│
└── make_room_glb_backend/      # Backend (FastAPI + OpenCV)
    ├── main.py
    ├── requirements.txt
    └── README.md
```

## Setup Instructions

### 1. Backend Setup

```bash
cd make_room_glb_backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Frontend Setup

```bash
cd make_room_glb

# Install dependencies
npm install
```

## Running the Application

You need to run both the backend and frontend servers simultaneously.

### Terminal 1: Run Backend

```bash
cd make_room_glb_backend
source venv/bin/activate  # Activate venv
python main.py
```

The backend server will start on http://localhost:8000

### Terminal 2: Run Frontend

```bash
cd make_room_glb
npm run dev
```

The frontend will start on http://localhost:5173 (or another port if 5173 is occupied)

## How It Works

### Workflow

1. User clicks on a tile to select it
2. User uploads an image file
3. Frontend sends the image to backend via POST /upload-texture
4. Backend processes the image:
   - Resizes to 128x128
   - Creates 4 mirror-flipped tiles
   - Combines into 256x256 seamless texture
   - Applies Gaussian blur at seams
5. Backend returns base64-encoded seamless texture
6. Frontend displays the texture in the image gallery
7. User selects the processed texture and applies it to selected tiles
8. The texture tiles perfectly without visible seams

### API Endpoint

**POST /upload-texture**

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

## Troubleshooting

### Backend Issues

1. **ImportError for OpenCV or other packages**
   - Make sure virtual environment is activated
   - Run `pip install -r requirements.txt` again

2. **Port 8000 already in use**
   - Change port in main.py: `uvicorn.run(app, host="0.0.0.0", port=8001)`
   - Update frontend fetch URL in RoomTest.jsx accordingly

### Frontend Issues

1. **CORS errors**
   - Make sure backend is running on port 8000
   - Check CORS configuration in main.py

2. **"Failed to fetch" or network errors**
   - Verify backend is running: visit http://localhost:8000 in browser
   - Check browser console for exact error message

3. **Texture not displaying**
   - Check browser console for errors
   - Verify backend returned valid base64 image data

## Testing the Seamless Texture

To verify the seamless tiling works correctly:

1. Upload a test image with distinct patterns
2. Select multiple adjacent tiles (e.g., select entire floor)
3. Apply the processed texture
4. Check that there are no visible seams between tiles
5. The texture should repeat smoothly across all selected tiles

## Performance Notes

- Backend processing time: < 0.1 seconds per image
- Generated texture size: 256x256 pixels
- Output format: JPEG with 90% quality
- The mirror tiling technique ensures perfect seamless repetition

## AWS Deployment Guide

### Quick Summary

- **Frontend**: Deploy to S3 + CloudFront or AWS Amplify
- **Backend**: Deploy to EC2 or Elastic Beanstalk
- **Communication**: Update CORS settings and API URLs

### Step-by-Step Deployment

1. **Deploy Backend First**

Choose one of these options:

**EC2 (Simple)**:
- Launch an EC2 instance
- Install Python and dependencies
- Run the FastAPI server
- Open port 8000 in security group

**Elastic Beanstalk (Managed)**:
- Use EB CLI to deploy
- Automatic scaling and load balancing
- See backend README for details

2. **Deploy Frontend**

Choose one of these options:

**S3 + CloudFront (Cost-effective)**:
- Build the React app: `npm run build`
- Upload to S3 bucket
- Set up CloudFront for HTTPS
- See frontend README for details

**AWS Amplify (Easiest)**:
- One-command deployment: `amplify publish`
- Automatic CI/CD from Git
- See frontend README for details

3. **Connect Frontend to Backend**

Update the API URL in frontend code:

```javascript
// In RoomTest.jsx
const response = await fetch("https://your-backend-url/upload-texture", {
```

Update CORS in backend code:

```python
# In main.py
allow_origins=["https://your-frontend-url.com"]
```

4. **Test the Integration**

- Open your frontend URL
- Upload an image
- Verify it processes correctly
- Check browser console for any CORS errors

For detailed deployment instructions, see the README files in each project folder.
