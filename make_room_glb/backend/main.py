from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import cv2
import numpy as np
from PIL import Image
import io
import base64
from typing import Optional

app = FastAPI(title="Hyper-Room Decorator API")

# CORS configuration for frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],  # Vite ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def create_seamless_texture(image: np.ndarray, target_size: int = 256) -> np.ndarray:
    """
    Create a seamless texture using mirror tiling technique.

    Args:
        image: Input image as numpy array (BGR format)
        target_size: Target output size (default 256x256)

    Returns:
        Seamless texture as numpy array
    """
    # Resize image to half of target size first
    half_size = target_size // 2
    resized = cv2.resize(image, (half_size, half_size), interpolation=cv2.INTER_LANCZOS4)

    # Create mirror tiles
    # Top-left: original
    top_left = resized

    # Top-right: horizontal flip
    top_right = cv2.flip(resized, 1)

    # Bottom-left: vertical flip
    bottom_left = cv2.flip(resized, 0)

    # Bottom-right: both flips
    bottom_right = cv2.flip(resized, -1)

    # Concatenate tiles
    top_half = np.hstack([top_left, top_right])
    bottom_half = np.hstack([bottom_left, bottom_right])
    seamless = np.vstack([top_half, bottom_half])

    # Apply slight Gaussian blur at seams to smooth transitions
    # Create blend mask for horizontal and vertical seams
    blended = seamless.copy()

    # Horizontal seam blur (middle horizontal line)
    kernel_size = 5
    center_h = target_size // 2
    roi_h = blended[center_h - kernel_size:center_h + kernel_size, :]
    blurred_h = cv2.GaussianBlur(roi_h, (kernel_size, kernel_size), 0)
    blended[center_h - kernel_size:center_h + kernel_size, :] = blurred_h

    # Vertical seam blur (middle vertical line)
    center_v = target_size // 2
    roi_v = blended[:, center_v - kernel_size:center_v + kernel_size]
    blurred_v = cv2.GaussianBlur(roi_v, (kernel_size, kernel_size), 0)
    blended[:, center_v - kernel_size:center_v + kernel_size] = blurred_v

    return blended


def numpy_to_base64(image: np.ndarray) -> str:
    """Convert numpy array to base64 encoded JPEG string."""
    # Convert BGR to RGB
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    # Convert to PIL Image
    pil_image = Image.fromarray(image_rgb)

    # Save to bytes buffer
    buffer = io.BytesIO()
    pil_image.save(buffer, format="JPEG", quality=90)

    # Encode to base64
    img_str = base64.b64encode(buffer.getvalue()).decode()

    return f"data:image/jpeg;base64,{img_str}"


@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "ok", "message": "Hyper-Room Decorator API is running"}


@app.options("/upload-texture")
async def upload_texture_options():
    """Handle preflight CORS request."""
    return JSONResponse(
        content={},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        }
    )


@app.post("/upload-texture")
async def upload_texture(file: UploadFile = File(...)):
    """
    Upload an image and convert it to a seamless texture.

    Args:
        file: Uploaded image file

    Returns:
        JSON with base64 encoded seamless texture
    """
    try:
        print(f"[DEBUG] Received file: {file.filename}, content_type: {file.content_type}")

        # Read uploaded file
        contents = await file.read()
        print(f"[DEBUG] File size: {len(contents)} bytes")

        # Convert to numpy array
        nparr = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if image is None:
            print("[ERROR] Failed to decode image")
            raise HTTPException(status_code=400, detail="Invalid image file")

        print(f"[DEBUG] Image decoded: {image.shape}")

        # Create seamless texture
        seamless_texture = create_seamless_texture(image, target_size=256)
        print(f"[DEBUG] Seamless texture created: {seamless_texture.shape}")

        # Convert to base64
        texture_base64 = numpy_to_base64(seamless_texture)
        base64_length = len(texture_base64)
        print(f"[DEBUG] Base64 length: {base64_length} characters")

        response_data = {
            "success": True,
            "texture_url": texture_base64,
            "size": 256
        }

        print(f"[DEBUG] Sending response with success=True")

        return JSONResponse(
            content=response_data,
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "*",
            }
        )

    except HTTPException as he:
        print(f"[ERROR] HTTPException: {he.detail}")
        raise he
    except Exception as e:
        print(f"[ERROR] Exception: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
