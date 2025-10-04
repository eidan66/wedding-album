# wedding-album Media Processing Infrastructure

This directory contains the infrastructure components for processing wedding media uploads, including the Lambda function that normalizes videos and images for mobile compatibility.

## Overview

The system consists of:
1. **S3 Bucket** with CORS configuration for uploads
2. **Lambda Function** that processes uploaded media using FFmpeg
3. **S3 Triggers** that automatically process files when uploaded to the `*/raw/` prefix
4. **Processed Media Storage** in the `*/processed/` prefix structure

## Architecture

```
User Upload → S3 raw/ → Lambda Trigger → FFmpeg Processing → S3 processed/
```

### File Structure
- `{coupleId}/raw/{uuid}.{ext}` - Original uploaded files
- `{coupleId}/processed/{uuid}.mp4` - Normalized MP4 video
- `{coupleId}/processed/{uuid}.webm` - WebM video (if generated)
- `{coupleId}/processed/{uuid}.jpg` - Poster/thumbnail image
- `{coupleId}/processed/{uuid}.json` - Metadata and processing status

## Prerequisites

1. **AWS CLI** configured with appropriate permissions
2. **FFmpeg** installed locally for testing
3. **Node.js 18+** and **Yarn**
4. **Serverless Framework** (optional, for deployment)

## Setup Instructions

### 1. S3 Bucket Configuration

Apply the CORS configuration from `docs/s3-cors-config.md` to your S3 bucket.

### 2. Environment Variables

Set the following environment variables:

```bash
export AWS_REGION=us-east-1
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export S3_BUCKET_NAME=your-bucket-name
```

### 3. Install Dependencies

```bash
cd infrastructure/lambda/normalize-media
yarn install
```

### 4. Local Testing

Test the media processing logic locally:

```bash
# From project root
yarn process:local

# Or from lambda directory
cd infrastructure/lambda/normalize-media
yarn test:local
```

This will:
- Check if FFmpeg is available
- Create test video and image files
- Process them using the same logic as the Lambda
- Verify outputs are generated correctly

## Deployment

### Option 1: Serverless Framework (Recommended)

1. Install Serverless Framework:
```bash
npm install -g serverless
```

2. Deploy the Lambda:
```bash
cd infrastructure/lambda/normalize-media
yarn build
serverless deploy
```

### Option 2: Manual Lambda Deployment

1. Build the function:
```bash
yarn lambda:build
```

2. Package the function:
```bash
yarn lambda:package
```

3. Upload to AWS Lambda:
   - Create a new Lambda function with Node.js 18.x runtime
   - Set memory to 3008 MB (maximum)
   - Set timeout to 900 seconds (15 minutes)
   - Upload the `function.zip` file
   - Configure S3 trigger on the `*/raw/` prefix

### Option 3: AWS CDK

Create a CDK stack that includes:
- S3 bucket with CORS
- Lambda function with FFmpeg layer
- S3 trigger configuration
- IAM roles and policies

## FFmpeg Layer

The Lambda function requires FFmpeg. You can use a pre-built layer:

**Public FFmpeg Layer ARN:**
```
arn:aws:lambda:us-east-1:175033217214:layer:ffmpeg:1
```

**Alternative:** Build your own layer with FFmpeg static binaries for Linux ARM64.

## Processing Details

### Video Processing
- **Input**: Any video format (MOV, HEVC, MP4, WebM, MKV, etc.)
- **Output**: 
  - MP4 (H.264/AAC, 720p max, CRF 23)
  - WebM (VP9/Opus, 720p max, CRF 33) - for files < 100MB
  - Poster image (JPEG, extracted at 1 second)

### Image Processing
- **Input**: Any image format (JPEG, PNG, HEIC, etc.)
- **Output**: 
  - JPEG poster/thumbnail
  - Original image preserved

### Error Handling
- Failed processing creates a JSON file with `status: "failed"`
- UI can display appropriate error states
- Original files remain in the `raw/` folder for debugging

## Monitoring and Debugging

### CloudWatch Logs
The Lambda function logs all processing steps, including:
- File download/upload operations
- FFmpeg command execution
- Processing results and errors

### S3 Event Notifications
Configure S3 event notifications to:
- Send processing completion events to EventBridge
- Trigger additional workflows
- Send notifications to users

## Performance Considerations

- **Memory**: 3008 MB provides optimal FFmpeg performance
- **Timeout**: 15 minutes handles large video files
- **Concurrency**: Lambda automatically scales based on S3 events
- **Storage**: Processed files are optimized for mobile viewing

## Cost Optimization

- **Lambda**: Pay per execution (typically $0.0000166667 per GB-second)
- **S3**: Standard storage for raw files, Standard-IA for processed files
- **Data Transfer**: Minimize with CloudFront distribution for processed media

## Security

- **IAM**: Least privilege access to S3 and Lambda
- **CORS**: Configured for your domain(s) in production
- **Encryption**: Enable S3 bucket encryption
- **VPC**: Consider VPC configuration for additional security

## Troubleshooting

### Common Issues

1. **FFmpeg not found**: Ensure the Lambda layer is attached
2. **Memory errors**: Increase Lambda memory allocation
3. **Timeout errors**: Increase Lambda timeout or optimize FFmpeg commands
4. **S3 permissions**: Verify IAM roles have correct S3 access

### Debug Commands

```bash
# Check Lambda logs
aws logs tail /aws/lambda/your-function-name --follow

# Test S3 trigger manually
aws s3 cp test-file.mp4 s3://your-bucket/test-couple/raw/test.mp4

# Verify processed files
aws s3 ls s3://your-bucket/test-couple/processed/
```

## Future Enhancements

- **MediaConvert Integration**: For complex video processing
- **Multiple Quality Levels**: Generate different resolutions
- **Batch Processing**: Process multiple files in sequence
- **Progress Tracking**: Real-time processing status updates
- **Format Detection**: Automatic format selection based on device capabilities
