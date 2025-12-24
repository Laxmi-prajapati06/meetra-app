# Upload Timeout Issues - FIXED

## Problem
You were receiving a "Request Timeout" error when uploading profile pictures.

## Root Causes
1. **Server timeout was too short** - Express default timeout is 2 minutes but Cloudinary upload can take longer
2. **No client-side timeout handling** - Frontend fetch had no abort mechanism
3. **Cloudinary upload had no timeout** - Upload stream could hang indefinitely

## Solutions Implemented

### 1. Backend Timeout Configuration (`server.js`)
- Added socket timeout: **60 seconds** for normal requests
- Added socket timeout: **120 seconds** for upload endpoints
- Prevents request from hanging indefinitely

### 2. Cloudinary Upload Timeout (`middleware/upload.js`)
- Added 30-second timeout for Cloudinary upload stream
- Handles timeout errors gracefully
- Optimizes quality setting to speed up upload
- Detects and clears timeouts properly

### 3. Frontend Timeout Handling (`src/services/api.js`)
- Added AbortController with **120-second timeout**
- Properly handles timeout errors with user-friendly messages
- Logs upload progress for debugging

### 4. Better Error Messages
- Timeout errors now provide clear guidance:
  - "Upload timed out. The file may be too large or your connection is slow. Try with a smaller image."
- Logs upload file size to diagnose issues
- Server returns HTTP 408 for timeout errors

## Current Limits

| Setting | Value |
|---------|-------|
| Max file size | 5 MB |
| Recommended file size | < 2 MB (faster upload) |
| Upload timeout | 30 seconds |
| Total request timeout | 120 seconds |
| Supported formats | JPEG, PNG, GIF, WebP, BMP, SVG |

## What to Do If Upload Still Times Out

### 1. Compress the Image First
   - Use online tools like TinyPNG, Compressor.io, or ImageMagick
   - Target: 1-2 MB file size
   - Most profile pictures should be < 500 KB

### 2. Check Your Internet Connection
   - Test your upload speed: speedtest.net
   - Minimum required: 1 Mbps upload speed
   - If slower, compress the image more

### 3. Check Backend Logs
   - Look for `[Upload]` logs in your Node.js console
   - Should see: "Uploading to Cloudinary..." → "Cloudinary upload successful"
   - If stuck between these, it's a Cloudinary timeout

### 4. Verify Cloudinary Configuration
   - Make sure `.env` has correct credentials (not placeholder values)
   - Restart backend after changing `.env`
   - Check Cloudinary Dashboard for API availability

## Testing Upload
1. Use a small image (< 500 KB)
2. Check browser console for detailed logs
3. Check Node.js console for backend logs
4. If successful, try with larger images

## Debugging Tips
- Small uploads (< 500 KB) should complete in 2-5 seconds
- Medium uploads (1-2 MB) may take 10-20 seconds
- If it takes > 30 seconds, it will timeout
- Check your internet speed - slow connections will timeout

