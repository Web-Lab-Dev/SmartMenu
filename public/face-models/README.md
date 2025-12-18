# Face-API.js Models

This directory should contain the pre-trained models for face detection and landmarks.

## Required Models

Download the following models from the [face-api.js repository](https://github.com/justadudewhohacks/face-api.js/tree/master/weights):

1. **tiny_face_detector_model-weights_manifest.json**
2. **tiny_face_detector_model-shard1**
3. **face_landmark_68_tiny_model-weights_manifest.json**
4. **face_landmark_68_tiny_model-shard1**

## Quick Download

```bash
cd public/face-models
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-weights_manifest.json
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-shard1
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_tiny_model-weights_manifest.json
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_tiny_model-shard1
```

## Why Tiny Models?

We use the "tiny" versions for optimal mobile performance:
- Faster detection (~30-40ms per frame)
- Lower memory footprint
- Still accurate enough for AR sticker placement

## File Structure

After downloading, your directory should look like:
```
public/face-models/
├── README.md (this file)
├── tiny_face_detector_model-weights_manifest.json
├── tiny_face_detector_model-shard1
├── face_landmark_68_tiny_model-weights_manifest.json
└── face_landmark_68_tiny_model-shard1
```

## Troubleshooting

If AR stickers don't work:
1. Check browser console for model loading errors
2. Verify all 4 files are present
3. Ensure files are accessible at `/face-models/*`
4. Try clearing browser cache
