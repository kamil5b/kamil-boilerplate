import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface StorageConfig {
  s3?: {
    endpoint?: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucket: string;
    forcePathStyle?: boolean;
  };
  localBackupPath: string;
}

export interface UploadResult {
  storageType: 'S3' | 'LOCAL';
  storagePath: string;
  s3Bucket?: string;
  s3Key?: string;
}

export interface StorageService {
  uploadFile(file: Buffer, filename: string, mimeType: string): Promise<UploadResult>;
  getFileUrl(result: UploadResult): Promise<string>;
  getFile(result: UploadResult): Promise<Buffer>;
  deleteFile(result: UploadResult): Promise<void>;
}

export function createStorageService(): StorageService {
  const config: StorageConfig = {
    s3: process.env.S3_ENDPOINT ? {
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.S3_REGION || 'us-east-1',
      accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
      bucket: process.env.S3_BUCKET || '',
      forcePathStyle: true,
    } : undefined,
    localBackupPath: path.join(process.cwd(), 'backup-storage'),
  };

  let s3Client: S3Client | null = null;

  // Try to initialize S3 client if config is available
  if (config.s3 && config.s3.accessKeyId && config.s3.secretAccessKey && config.s3.bucket) {
    try {
      s3Client = new S3Client({
        endpoint: config.s3.endpoint,
        region: config.s3.region,
        credentials: {
          accessKeyId: config.s3.accessKeyId,
          secretAccessKey: config.s3.secretAccessKey,
        },
        forcePathStyle: config.s3.forcePathStyle,
      });
      console.log('S3 client initialized successfully');
    } catch (error) {
      console.warn('Failed to initialize S3 client, will use local storage:', error);
      s3Client = null;
    }
  } else {
    console.log('S3 configuration not found, using local storage');
  }

  async function ensureLocalDirectory() {
    try {
      await fs.mkdir(config.localBackupPath, { recursive: true });
    } catch (error) {
      console.error('Failed to create local backup directory:', error);
      throw new Error('Failed to initialize local storage');
    }
  }

  async function uploadToS3(file: Buffer, filename: string, mimeType: string): Promise<UploadResult> {
    if (!s3Client || !config.s3) {
      throw new Error('S3 client not initialized');
    }

    const key = `uploads/${new Date().toISOString().split('T')[0]}/${uuidv4()}-${filename}`;

    try {
      const command = new PutObjectCommand({
        Bucket: config.s3.bucket,
        Key: key,
        Body: file,
        ContentType: mimeType,
      });

      await s3Client.send(command);

      return {
        storageType: 'S3',
        storagePath: key,
        s3Bucket: config.s3.bucket,
        s3Key: key,
      };
    } catch (error) {
      console.error('Failed to upload to S3:', error);
      throw error;
    }
  }

  async function uploadToLocal(file: Buffer, filename: string): Promise<UploadResult> {
    await ensureLocalDirectory();

    const dateFolder = new Date().toISOString().split('T')[0];
    const folderPath = path.join(config.localBackupPath, dateFolder);
    await fs.mkdir(folderPath, { recursive: true });

    const uniqueFilename = `${uuidv4()}-${filename}`;
    const filePath = path.join(folderPath, uniqueFilename);

    await fs.writeFile(filePath, file);

    return {
      storageType: 'LOCAL',
      storagePath: path.join(dateFolder, uniqueFilename),
    };
  }

  return {
    async uploadFile(file: Buffer, filename: string, mimeType: string): Promise<UploadResult> {
      // Try S3 first if available
      if (s3Client && config.s3) {
        try {
          return await uploadToS3(file, filename, mimeType);
        } catch (error) {
          console.warn('S3 upload failed, falling back to local storage:', error);
        }
      }

      // Fallback to local storage
      return await uploadToLocal(file, filename);
    },

    async getFileUrl(result: UploadResult): Promise<string> {
      if (result.storageType === 'S3' && s3Client && config.s3) {
        try {
          const command = new GetObjectCommand({
            Bucket: result.s3Bucket || config.s3.bucket,
            Key: result.s3Key || result.storagePath,
          });

          const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
          return url;
        } catch (error) {
          console.error('Failed to generate S3 URL:', error);
        }
      }

      // For local files, return API endpoint
      return `/api/files/${result.storagePath}`;
    },

    async getFile(result: UploadResult): Promise<Buffer> {
      if (result.storageType === 'S3' && s3Client && config.s3) {
        try {
          const command = new GetObjectCommand({
            Bucket: result.s3Bucket || config.s3.bucket,
            Key: result.s3Key || result.storagePath,
          });

          const response = await s3Client.send(command);
          const stream = response.Body as any;
          const chunks: Buffer[] = [];
          
          for await (const chunk of stream) {
            chunks.push(chunk);
          }

          return Buffer.concat(chunks);
        } catch (error) {
          console.error('Failed to get file from S3:', error);
          throw error;
        }
      }

      // Get from local storage
      const filePath = path.join(config.localBackupPath, result.storagePath);
      return await fs.readFile(filePath);
    },

    async deleteFile(result: UploadResult): Promise<void> {
      if (result.storageType === 'S3' && s3Client && config.s3) {
        // S3 deletion would go here if needed
        // For now, we'll skip S3 deletion to keep files as backup
      }

      // Delete from local storage if exists
      if (result.storageType === 'LOCAL') {
        try {
          const filePath = path.join(config.localBackupPath, result.storagePath);
          await fs.unlink(filePath);
        } catch (error) {
          console.error('Failed to delete local file:', error);
        }
      }
    },
  };
}
