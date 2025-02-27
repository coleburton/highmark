import sys
import cv2
import numpy as np
import os
import argparse
from rembg import remove, new_session
from PIL import Image, UnidentifiedImageError
import pillow_avif  # This enables AVIF support in PIL
from supabase import create_client
import io
import dotenv
import os

# Load environment variables from .env file if it exists
dotenv.load_dotenv()

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY", os.getenv("SUPABASE_KEY"))  # Try service key first, then fall back to regular key
BUCKET_NAME = "assets"  # The bucket name without any path

def trim_edges(image_path, image_data=None):
    # Load image either from path or from provided data
    if image_data is not None:
        image = image_data
    else:
        image = cv2.imread(image_path, cv2.IMREAD_UNCHANGED)
    
    if image is None:
        print(f"Error: Could not load image from {image_path}")
        return None
    
    try:
        # For RGBA images, use alpha channel for contour detection
        if len(image.shape) == 3 and image.shape[2] == 4:
            # Use alpha channel for contour detection
            alpha = image[:, :, 3]
            _, thresh = cv2.threshold(alpha, 1, 255, cv2.THRESH_BINARY)
        else:
            # Convert to grayscale for edge detection
            if len(image.shape) == 3 and image.shape[2] >= 3:
                gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            else:
                gray = image.copy()  # Already grayscale
            
            # Apply threshold to create a mask
            _, thresh = cv2.threshold(gray, 1, 255, cv2.THRESH_BINARY)
        
        # Find contours
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if not contours:
            print("Warning: No contours found in the image.")
            return image  # Return original image if no contours found
        
        # Get bounding box of the largest contour
        x, y, w, h = cv2.boundingRect(max(contours, key=cv2.contourArea))
        
        # Add a small padding to avoid cutting off edges
        padding = 10
        x = max(0, x - padding)
        y = max(0, y - padding)
        w = min(image.shape[1] - x, w + 2 * padding)
        h = min(image.shape[0] - y, h + 2 * padding)
        
        # Crop image to bounding box
        cropped = image[y:y+h, x:x+w]
        
        return cropped
    except Exception as e:
        print(f"Error during edge trimming: {str(e)}")
        return image  # Return original image if trimming fails

def check_supabase_connection():
    """Check connection to Supabase and list available buckets"""
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("Error: Supabase credentials not found. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables.")
        return False
    
    try:
        print(f"Connecting to Supabase at: {SUPABASE_URL}")
        print(f"Using key starting with: {SUPABASE_KEY[:10]}...")
        
        # Create Supabase client
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        # List buckets
        print("Listing available buckets:")
        buckets = supabase.storage.list_buckets()
        
        bucket_found = False
        # for bucket in buckets:
        #     print(f"Bucket: {bucket}")
        #     # Check if our target bucket exists
        #     if hasattr(bucket, 'name') and bucket.name == BUCKET_NAME:
        #         bucket_found = True
        #         print(f"Found our target bucket: {BUCKET_NAME}")
        
        # if not bucket_found:
        #     print(f"Warning: Target bucket '{BUCKET_NAME}' not found!")
        
        # # Try to list files in the target bucket
        # try:
        #     print(f"\nListing files in bucket '{BUCKET_NAME}':")
        #     # List files in the root
        #     files = supabase.storage.from_(BUCKET_NAME).list()
        #     print(f"Files in root: {files}")
            
        #     # Try to list files in the assets directory
        #     try:
        #         assets_files = supabase.storage.from_(BUCKET_NAME).list("assets")
        #         print(f"Files in 'assets' directory: {assets_files}")
                
        #         # Try to list files in the assets/images directory
        #         try:
        #             images_files = supabase.storage.from_(BUCKET_NAME).list("assets/images")
        #             print(f"Files in 'assets/images' directory: {images_files}")
                    
        #             # Try to list files in the assets/images/strains directory
        #             try:
        #                 strain_files = supabase.storage.from_(BUCKET_NAME).list("assets/images/strains")
        #                 print(f"Files in 'assets/images/strains' directory: {strain_files}")
        #             except Exception as e:
        #                 print(f"Note: Could not list files in 'assets/images/strains' directory: {str(e)}")
        #                 print("This may be normal if the directory doesn't exist yet.")
        #         except Exception as e:
        #             print(f"Note: Could not list files in 'assets/images' directory: {str(e)}")
        #             print("This may be normal if the directory doesn't exist yet.")
        #     except Exception as e:
        #         print(f"Note: Could not list files in 'assets' directory: {str(e)}")
        #         print("This may be normal if the directory doesn't exist yet.")
        # except Exception as e:
        #     print(f"Error listing files in bucket: {str(e)}")
        
        return True
    except Exception as e:
        print(f"Error connecting to Supabase: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def upload_to_supabase(image_data, file_name):
    """Upload the processed image to Supabase Storage"""
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("Error: Supabase credentials not found. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables.")
        return False
    
    try:
        print(f"Connecting to Supabase at: {SUPABASE_URL}")
        # Create Supabase client
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        # Convert PIL Image to bytes - keep as PNG with transparency
        img_byte_arr = io.BytesIO()
        image_data.save(img_byte_arr, format='PNG')
        img_byte_arr.seek(0)  # Reset the pointer to the beginning of the BytesIO object
        
        # Upload to Supabase with .png extension to preserve transparency
        storage_path = f"assets/images/strains/{file_name}.png"
        print(f"Uploading to Supabase bucket '{BUCKET_NAME}', path: {storage_path}")
        
        # Try to upload directly with upsert option
        try:
            result = supabase.storage.from_(BUCKET_NAME).upload(
                storage_path,
                img_byte_arr.getvalue(),
                {"content-type": "image/png", "upsert": "true"}
            )
            print(f"Upload result: {result}")
            
            # Get public URL
            public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(storage_path)
            print(f"Image uploaded successfully. Public URL: {public_url}")
            return True
        except Exception as e:
            print(f"Error during upload operation: {str(e)}")
            
            # Try an alternative approach - upload to root first
            try:
                print("Trying alternative upload approach...")
                # First ensure the directory exists by creating a placeholder
                try:
                    empty_file = io.BytesIO(b"")
                    supabase.storage.from_(BUCKET_NAME).upload(
                        "assets/images/strains/.placeholder",
                        empty_file.getvalue(),
                        {"content-type": "text/plain", "upsert": "true"}
                    )
                    print("Created directory structure with placeholder file")
                except Exception as e_dir:
                    print(f"Note: Could not create directory structure: {str(e_dir)}")
                
                # Reset the image data
                img_byte_arr.seek(0)
                
                # Try upload again
                result = supabase.storage.from_(BUCKET_NAME).upload(
                    storage_path,
                    img_byte_arr.getvalue(),
                    {"content-type": "image/png", "upsert": "true"}
                )
                
                public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(storage_path)
                print(f"Second attempt successful. Public URL: {public_url}")
                return True
            except Exception as e2:
                print(f"Second upload attempt failed: {str(e2)}")
                
                # One last attempt - try updating instead of uploading
                try:
                    print("Trying update instead of upload...")
                    img_byte_arr.seek(0)
                    result = supabase.storage.from_(BUCKET_NAME).update(
                        storage_path,
                        img_byte_arr.getvalue(),
                        {"content-type": "image/png"}
                    )
                    
                    public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(storage_path)
                    print(f"Update attempt successful. Public URL: {public_url}")
                    return True
                except Exception as e3:
                    print(f"Update attempt failed: {str(e3)}")
                    return False
    
    except Exception as e:
        print(f"Error uploading to Supabase: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def process_image(image_path, strain_name=None):
    try:
        # Check if file exists
        if not os.path.exists(image_path):
            print(f"Error: File not found: {image_path}")
            return
            
        # Get file info
        file_size = os.path.getsize(image_path) / (1024 * 1024)  # Size in MB
        print(f"Processing image: {image_path} ({file_size:.2f} MB)")
        
        # Determine output filename
        if strain_name:
            # Use provided strain name for both local file and Supabase upload
            output_name = strain_name
            print(f"Using provided strain name: {strain_name}")
            print(f"The image will be uploaded to Supabase as: {strain_name}.png")
        else:
            # Use original filename without extension
            output_name = os.path.splitext(os.path.basename(image_path))[0]
            print(f"Using original filename: {output_name}")
            print("Note: No strain name provided, so the image will not be uploaded to Supabase.")
        
        try:
            # Try to open the image
            input_image = Image.open(image_path)
            print(f"Image format: {input_image.format}, Mode: {input_image.mode}, Size: {input_image.size}")
            
            # Save a copy of the original image in a format OpenCV can read
            # This ensures we preserve the original colors
            original_pil = input_image.copy()
            temp_path = os.path.join(os.path.dirname(image_path), "_temp_original.png")
            original_pil.save(temp_path)
            print(f"Saved temporary copy for color preservation: {temp_path}")
            
        except UnidentifiedImageError:
            print(f"Warning: PIL could not identify the image format. Checking file type...")
            # Use system file command to check actual file type
            import subprocess
            result = subprocess.run(['file', image_path], capture_output=True, text=True)
            print(f"File type: {result.stdout.strip()}")
            
            # Try again with pillow-avif-plugin enabled
            try:
                input_image = Image.open(image_path)
                print(f"Successfully opened with pillow-avif-plugin. Format: {input_image.format}")
                
                # Save a copy of the original image in a format OpenCV can read
                original_pil = input_image.copy()
                temp_path = os.path.join(os.path.dirname(image_path), "_temp_original.png")
                original_pil.save(temp_path)
                print(f"Saved temporary copy for color preservation: {temp_path}")
                
            except Exception as e:
                print(f"Error: Could not open image even with AVIF support: {str(e)}")
                return

        # Load original image with OpenCV from the temporary PNG
        original_cv = cv2.imread(temp_path, cv2.IMREAD_UNCHANGED)
        if original_cv is None:
            print("Warning: Could not load temporary image with OpenCV, using PIL image directly.")
            original_cv = np.array(original_pil)
            if len(original_cv.shape) == 3 and original_cv.shape[2] == 3:
                original_cv = cv2.cvtColor(original_cv, cv2.COLOR_RGB2BGR)  # Convert RGB to BGR for OpenCV

        # Create a session with the u2net model which is better for detailed objects
        print("Creating background removal session with u2net model...")
        session = new_session("u2net")
        
        # Remove background with more conservative settings
        print("Removing background with enhanced settings...")
        output_image = remove(
            input_image,
            session=session,
            alpha_matting=True,  # Enable alpha matting for better edge detection
            alpha_matting_foreground_threshold=240,  # Higher threshold to keep more of the foreground
            alpha_matting_background_threshold=10,   # Lower threshold to remove less of the background
            alpha_matting_erode_size=10             # Larger erode size to preserve more details
        )
        
        # Save the intermediate result for debugging
        debug_path = os.path.join(os.path.dirname(image_path), "_debug_mask.png")
        output_image.save(debug_path)
        print(f"Saved debug mask to: {debug_path}")
        
        # Extract alpha channel as mask
        output_array = np.array(output_image)
        if output_array.shape[2] == 4:  # RGBA
            # Extract alpha channel
            alpha_mask = output_array[:, :, 3]
            
            # Apply some processing to improve the mask
            # Dilate the mask to include more of the edges
            kernel = np.ones((7, 7), np.uint8)
            alpha_mask = cv2.dilate(alpha_mask, kernel, iterations=1)
            
            # Resize original image if needed to match mask dimensions
            if original_cv.shape[:2] != output_array.shape[:2]:
                print("Resizing original image to match mask dimensions...")
                original_cv = cv2.resize(original_cv, (output_array.shape[1], output_array.shape[0]))
            
            # Create a 4-channel RGBA image
            if len(original_cv.shape) == 3 and original_cv.shape[2] == 3:
                # Convert BGR to RGB for PIL
                rgb_image = cv2.cvtColor(original_cv, cv2.COLOR_BGR2RGB)
                
                # Create RGBA image
                rgba_image = np.zeros((output_array.shape[0], output_array.shape[1], 4), dtype=np.uint8)
                rgba_image[:, :, 0:3] = rgb_image
                rgba_image[:, :, 3] = alpha_mask
            else:
                # Already has alpha channel
                rgba_image = original_cv.copy()
                rgba_image[:, :, 3] = alpha_mask
            
            # Trim edges using the processed image
            print("Trimming edges...")
            trimmed_image = trim_edges(image_path, rgba_image)
            
            # Convert to PIL Image for saving with transparency
            if trimmed_image is not None:
                trimmed_pil = Image.fromarray(trimmed_image)
                
                # Verify we have transparency
                print(f"Processed image mode: {trimmed_pil.mode}, Size: {trimmed_pil.size}")
                if trimmed_pil.mode != 'RGBA':
                    print("Warning: Processed image doesn't have transparency. Converting to RGBA...")
                    trimmed_pil = trimmed_pil.convert('RGBA')
                
                # Save locally as PNG with transparency
                local_output_filename = os.path.join(os.path.dirname(image_path), f"{output_name}_clean.png")
                print(f"Saving processed image locally to: {local_output_filename}")
                trimmed_pil.save(local_output_filename, format="PNG")
                
                # Upload to Supabase if strain name is provided
                if strain_name:
                    # First check if we can connect to Supabase
                    if check_supabase_connection():
                        print(f"Uploading processed image with mode: {trimmed_pil.mode}")
                        upload_success = upload_to_supabase(trimmed_pil, strain_name)
                        if upload_success:
                            print(f"Successfully uploaded image to Supabase with name: {strain_name}")
                        else:
                            print("Failed to upload image to Supabase")
                    else:
                        print("Skipping Supabase upload due to connection issues")
                
                print(f"Success! Processed image saved locally as: {local_output_filename}")
            else:
                print("Error: Failed to trim image.")
        else:
            print("Warning: No alpha channel found in processed image. Using original image.")
            # Save original as PNG
            local_output_filename = os.path.join(os.path.dirname(image_path), f"{output_name}_clean.png")
            cv2.imwrite(local_output_filename, original_cv)
            print(f"Saved original image as: {local_output_filename}")
        
        # Clean up temporary files
        try:
            os.remove(temp_path)
            print(f"Removed temporary file: {temp_path}")
            # Keep debug mask for now
            # os.remove(debug_path)
            # print(f"Removed debug mask: {debug_path}")
        except Exception as e:
            print(f"Warning: Could not remove temporary file: {str(e)}")
        
    except Exception as e:
        print(f"Error processing image: {str(e)}")
        import traceback
        traceback.print_exc()

def main():
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Process an image to remove background and trim edges.')
    parser.add_argument('image_path', nargs='?', help='Path to the input image file')
    parser.add_argument('--name', '-n', help='Strain name for the output file (optional)')
    parser.add_argument('--check-supabase', action='store_true', help='Check Supabase connection and list buckets')
    
    args = parser.parse_args()
    
    # Check Supabase connection if requested
    if args.check_supabase:
        check_supabase_connection()
        return
    
    # Ensure image_path is provided if not checking Supabase
    if not args.image_path:
        parser.error("image_path is required unless --check-supabase is used")
    
    # Process the image
    process_image(args.image_path, args.name)

if __name__ == "__main__":
    main()