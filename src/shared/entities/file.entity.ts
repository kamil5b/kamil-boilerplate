export interface File {
  id: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  size: number;
  storageType: 'S3' | 'LOCAL';
  storagePath: string;
  s3Bucket?: string | null;
  s3Key?: string | null;
  createdAt: Date;
  createdBy: string;
}
