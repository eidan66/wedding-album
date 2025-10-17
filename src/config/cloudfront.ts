// CloudFront configuration
export const CLOUDFRONT_DOMAIN = process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN || ''; // Must be set via environment variable

export const getCloudFrontUrl = (s3Key: string): string => {
  // Priority: Try CloudFront first (fastest), then fall back to S3
  // Note: The proxy route will handle authentication for both
  if (CLOUDFRONT_DOMAIN) {
    // CloudFront URL - will be proxied through our API for proper auth
    return `https://${CLOUDFRONT_DOMAIN}/${s3Key}`;
  }
  
  // Fallback to direct S3 URL
  console.warn('CloudFront domain not configured, using S3 direct URL');
  return getS3Url(s3Key);
};

export const getS3Url = (s3Key: string): string => {
  const bucketName = process.env.S3_BUCKET_NAME;
  const region = process.env.AWS_REGION;
  return `https://${bucketName}.s3.${region}.amazonaws.com/${s3Key}`;
};
