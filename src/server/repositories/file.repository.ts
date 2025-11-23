import { PoolClient } from "pg";
import { File } from "@/shared/entities";

/**
 * Map database row (snake_case) to File entity (camelCase)
 * CRITICAL: PostgreSQL returns snake_case column names, TypeScript expects camelCase
 */
function mapRowToFile(row: any): File {
  return {
    id: row.id,
    filename: row.filename,
    originalFilename: row.original_filename,
    mimeType: row.mime_type,
    size: row.size,
    storageType: row.storage_type,
    storagePath: row.storage_path,
    s3Bucket: row.s3_bucket,
    s3Key: row.s3_key,
    createdAt: row.created_at,
    createdBy: row.created_by,
  };
}

export interface FileRepository {
  create(
    client: PoolClient,
    data: {
      filename: string;
      originalFilename: string;
      mimeType: string;
      size: number;
      storageType: 'S3' | 'LOCAL';
      storagePath: string;
      s3Bucket?: string;
      s3Key?: string;
      createdBy: string;
    }
  ): Promise<File>;
  
  findById(client: PoolClient, id: string): Promise<File | null>;
  
  delete(client: PoolClient, id: string): Promise<void>;
}

export function createFileRepository(): FileRepository {
  return {
    async create(client, data) {
      const result = await client.query(
        `INSERT INTO files 
        (filename, original_filename, mime_type, size, storage_type, storage_path, s3_bucket, s3_key, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          data.filename,
          data.originalFilename,
          data.mimeType,
          data.size,
          data.storageType,
          data.storagePath,
          data.s3Bucket || null,
          data.s3Key || null,
          data.createdBy,
        ]
      );
      return mapRowToFile(result.rows[0]);
    },

    async findById(client, id) {
      const result = await client.query(
        `SELECT * FROM files WHERE id = $1`,
        [id]
      );
      return result.rows[0] ? mapRowToFile(result.rows[0]) : null;
    },

    async delete(client, id) {
      await client.query('DELETE FROM files WHERE id = $1', [id]);
    },
  };
}
