# Hyper-Room Decorator Backend

FastAPI backend for processing and generating seamless textures for the 3D room builder.

## Features

- Image upload and processing
- Seamless texture generation using mirror tiling technique
- Fast processing (under 0.1 seconds per image)
- CORS enabled for frontend integration
- Base64 encoded texture delivery

## Installation

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Usage

### Development

```bash
python main.py
```

or

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The server will start on http://localhost:8000

### API Endpoints

#### GET /
Health check endpoint.

Response:
```json
{
  "status": "ok",
  "message": "Hyper-Room Decorator API is running"
}
```

#### POST /upload-texture
Upload an image and receive a seamless texture.

Request:
- Method: POST
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

## Seamless Texture Algorithm

The backend uses a mirror tiling technique to create seamless textures:

1. Resize input image to 128x128
2. Create 4 tiles by flipping:
   - Top-left: Original
   - Top-right: Horizontal flip
   - Bottom-left: Vertical flip
   - Bottom-right: Both flips
3. Concatenate tiles to create 256x256 image
4. Apply Gaussian blur at seam lines for smooth transitions

This ensures textures tile perfectly without visible seams.

## Requirements

- Python 3.8+
- FastAPI
- OpenCV
- NumPy
- Pillow

## Frontend Integration

The frontend should send POST requests to `/upload-texture` with image files and receive base64 encoded seamless textures in response.

## AWS Deployment

### Option 1: EC2 (Recommended for simplicity)

1. Launch an EC2 instance (t2.micro or larger)
2. SSH into the instance and clone your repository
3. Install dependencies:
```bash
sudo apt update
sudo apt install python3-pip python3-venv -y
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

4. Run the server with a process manager like systemd or screen:
```bash
# Using screen for quick testing
screen -S backend
uvicorn main:app --host 0.0.0.0 --port 8000
# Press Ctrl+A then D to detach
```

5. Configure security group to allow inbound traffic on port 8000
6. Update frontend to use your EC2 public IP or domain

### Option 2: Elastic Beanstalk

1. Install the EB CLI:
```bash
pip install awsebcli
```

2. Create an application.py file in the project root:
```python
from main import app
```

3. Initialize and deploy:
```bash
eb init -p python-3.9 room-decorator-backend
eb create room-decorator-env
eb open
```

4. The API will be available at the Elastic Beanstalk URL

### Option 3: Lambda + API Gateway (For serverless)

This option requires adapting the code to work with AWS Lambda handlers. You would need to:

1. Use Mangum to wrap the FastAPI app for Lambda
2. Create a Lambda function with a container image (due to OpenCV size)
3. Set up API Gateway to trigger the Lambda function
4. Increase Lambda timeout to 30 seconds and memory to at least 512 MB

Note: Lambda cold starts may affect performance for the first request.

### Environment Configuration

When deploying to AWS, update the CORS origins in main.py to include your frontend domain:

```python
allow_origins=[
    "https://your-frontend-domain.com",
    "http://localhost:5173",  # Keep for local development
]
```
