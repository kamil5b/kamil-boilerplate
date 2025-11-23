import { getDbClient } from "../db";
import { createFileRepository } from "../repositories";
import { createStorageService } from "./storage.service";
import { AppError } from "../utils/error";
import { GetFileResponse, UploadFileResponse } from "@/shared/request/file.request";

export interface FileService {
  uploadFile(
    file: Buffer,
    originalFilename: string,
    mimeType: string,
    userId: string
  ): Promise<UploadFileResponse>;
  getFile(fileId: string): Promise<{ file: Buffer; mimeType: string; filename: string }>;
  getFileInfo(fileId: string): Promise<GetFileResponse>;
  deleteFile(fileId: string): Promise<void>;
}

export function createFileService(): FileService {
  const fileRepo = createFileRepository();
  const storageService = createStorageService();

  return {
    async uploadFile(file, originalFilename, mimeType, userId) {
      const client = await getDbClient();
      
      try {
        await client.query('BEGIN');
        
        // Business logic: Validate file
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.length > maxSize) {
          throw new AppError('File size exceeds 10MB limit', 400);
        }
        
        if (!originalFilename || !mimeType) {
          throw new AppError('Invalid file data', 400);
        }
        
        // Generate a safe filename
        const timestamp = Date.now();
        const safeName = originalFilename.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filename = `${timestamp}-${safeName}`;

        // Upload to storage (S3 with local fallback)
        const uploadResult = await storageService.uploadFile(file, filename, mimeType);

        // Save file metadata to database
        const fileRecord = await fileRepo.create(client, {
          filename,
          originalFilename,
          mimeType,
          size: file.length,
          storageType: uploadResult.storageType,
          storagePath: uploadResult.storagePath,
          s3Bucket: uploadResult.s3Bucket,
          s3Key: uploadResult.s3Key,
          createdBy: userId,
        });

        // Get file URL
        const url = await storageService.getFileUrl(uploadResult);
        
        await client.query('COMMIT');

        return {
          id: fileRecord.id,
          filename: fileRecord.filename,
          originalFilename: fileRecord.originalFilename,
          mimeType: fileRecord.mimeType,
          size: fileRecord.size,
          storageType: fileRecord.storageType,
          url,
        };
      } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error uploading file:", error);
        if (error instanceof AppError) {
          throw error;
        }
        throw new AppError("Failed to upload file", 500);
      } finally {
        client.release();
      }
    },

    async getFile(fileId) {
      const client = await getDbClient();
      
      try {
        await client.query('BEGIN');
        
        const fileRecord = await fileRepo.findById(client, fileId);
        if (!fileRecord) {
          throw new AppError("File not found", 404);
        }

        const file = await storageService.getFile({
          storageType: fileRecord.storageType,
          storagePath: fileRecord.storagePath,
          s3Bucket: fileRecord.s3Bucket || undefined,
          s3Key: fileRecord.s3Key || undefined,
        });
        
        await client.query('COMMIT');

        return {
          file,
          mimeType: fileRecord.mimeType,
          filename: fileRecord.originalFilename,
        };
      } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error retrieving file:", error);
        if (error instanceof AppError) {
          throw error;
        }
        throw new AppError("Failed to retrieve file", 500);
      } finally {
        client.release();
      }
    },

    async getFileInfo(fileId) {
      const client = await getDbClient();
      
      try {
        await client.query('BEGIN');
        
        const fileRecord = await fileRepo.findById(client, fileId);
        if (!fileRecord) {
          throw new AppError("File not found", 404);
        }

        const url = await storageService.getFileUrl({
          storageType: fileRecord.storageType,
          storagePath: fileRecord.storagePath,
          s3Bucket: fileRecord.s3Bucket || undefined,
          s3Key: fileRecord.s3Key || undefined,
        });
        
        await client.query('COMMIT');

        return {
          id: fileRecord.id,
          filename: fileRecord.filename,
          originalFilename: fileRecord.originalFilename,
          mimeType: fileRecord.mimeType,
          size: fileRecord.size,
          storageType: fileRecord.storageType,
          url,
          createdAt: fileRecord.createdAt.toISOString(),
        };
      } catch (error) {
        await client.query('ROLLBACK');
        if (error instanceof AppError) {
          throw error;
        }
        throw new AppError("Failed to get file info", 500);
      } finally {
        client.release();
      }
    },

    async deleteFile(fileId) {
      const client = await getDbClient();
      
      try {
        await client.query('BEGIN');
        
        const fileRecord = await fileRepo.findById(client, fileId);
        if (!fileRecord) {
          throw new AppError("File not found", 404);
        }

        await storageService.deleteFile({
          storageType: fileRecord.storageType,
          storagePath: fileRecord.storagePath,
          s3Bucket: fileRecord.s3Bucket || undefined,
          s3Key: fileRecord.s3Key || undefined,
        });

        await fileRepo.delete(client, fileId);
        
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error deleting file:", error);
        if (error instanceof AppError) {
          throw error;
        }
        throw new AppError("Failed to delete file", 500);
      } finally {
        client.release();
      }
    },
  };
}
