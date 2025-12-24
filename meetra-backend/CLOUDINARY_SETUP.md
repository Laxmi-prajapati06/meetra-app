# Cloudinary Setup Guide

The profile picture upload feature requires Cloudinary credentials. Follow these steps to set it up:

## Step 1: Create a Cloudinary Account

1. Go to [https://cloudinary.com/](https://cloudinary.com/)
2. Click "Sign Up Free" button
3. Complete the registration process (you can use Google, GitHub, or email)
4. Verify your email

## Step 2: Get Your Credentials

1. After signing in, go to your Dashboard
2. You'll see your **Cloud Name** at the top
3. Scroll down to find your **API Key** and **API Secret**

**Important:** Keep your API Secret private! Never commit it to version control.

## Step 3: Configure Environment Variables

1. Open `meetra-backend/.env` file
2. Replace the placeholder values with your actual credentials:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
CLOUDINARY_API_KEY=your_actual_api_key
CLOUDINARY_API_SECRET=your_actual_api_secret
```

### Example of what it should look like:
```env
CLOUDINARY_CLOUD_NAME=demo123
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abc_def_ghi_jkl_mno_pqr_stu
```

## Step 4: Restart the Server

1. Stop your Node.js server (Ctrl+C in the terminal)
2. Restart it with: `npm start` or `node server.js`
3. Try uploading a profile picture again

## Troubleshooting

### Error: "Unknown API key your_cloudinary_api_key"
- This means the placeholder values are still in your `.env` file
- Replace them with your actual credentials from Cloudinary Dashboard
- Make sure there are no extra spaces or quotes around the values

### Error: "Invalid cloud name"
- Double-check your `CLOUDINARY_CLOUD_NAME` value
- Copy it directly from your Cloudinary Dashboard

### Upload Still Fails After Setting Credentials
- Make sure your Node.js server was restarted after updating the `.env` file
- Check that the `.env` file is in the `meetra-backend/` directory
- Verify your credentials are correct in the Cloudinary Dashboard

## Features Enabled After Setup

Once Cloudinary is configured, you can:
- ✅ Upload profile pictures for users
- ✅ Profile pictures display in messaging
- ✅ Profile pictures display in People/Browse page
- ✅ Profile pictures display in user profiles
- ✅ Images are automatically optimized and converted to WebP format

## File Upload Specifications

- **Maximum file size:** 5MB
- **Supported formats:** JPEG, PNG, GIF, WebP, BMP, SVG
- **Storage location:** Cloudinary (secure cloud storage)
- **Image optimization:** Automatically converted to WebP for better performance
