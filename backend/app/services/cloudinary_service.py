import cloudinary
import cloudinary.uploader
from fastapi import UploadFile
from typing import Optional

from app.core.config import settings

# Initialize Cloudinary configuration
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True
)

def upload_image(file: UploadFile) -> Optional[str]:
    """
    Uploads an image to Cloudinary, converts it to webp, and resizes it.
    Returns the secure URL of the uploaded image.
    """
    try:
        # Upload to Cloudinary with transformations
        response = cloudinary.uploader.upload(
            file.file,
            folder="lanes_flood_reports",
            format="webp",
            transformation=[
                {"width": 1024, "crop": "limit"}
            ]
        )
        return response.get("secure_url")
    except Exception as e:
        print(f"Error uploading image to Cloudinary: {e}")
        return None
