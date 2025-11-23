# File Upload System

This system implements file upload with S3-compatible storage and automatic local fallback.

## Features

- ✅ **S3-Compatible Storage**: Works with AWS S3, MinIO, DigitalOcean Spaces, Wasabi, etc.
- ✅ **Automatic Local Fallback**: If S3 fails to initialize, files are stored locally in `backup-storage/`
- ✅ **File Attachments**: Add files to transactions and payments
- ✅ **Drag & Drop UI**: Modern file upload component with validation
- ✅ **Security**: File size limits, type validation, authenticated access
- ✅ **Architecture Compliant**: Follows SERVER.md layered architecture pattern

## Installation

### 1. Install Required Dependencies

```bash
pnpm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner uuid
pnpm install -D @types/uuid
```

### 2. Run Database Migrations

```bash
sql-migrate up
```

This will create:
- `files` table for file metadata
- Add `file_id` column to `transactions` table
- Add `file_id` column to `payments` table

### 3. Configure Environment Variables (Optional)

Add to your `.env` file:

```env
# S3-Compatible Storage (Optional)
# If not configured, files will be stored locally in backup-storage/
S3_ENDPOINT=https://s3.amazonaws.com
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=your-access-key-id
S3_SECRET_ACCESS_KEY=your-secret-access-key
S3_BUCKET=your-bucket-name
```

**Note**: If S3 credentials are not provided, the system will automatically use local storage.

### 4. Create Local Backup Directory (Automatic)

The `backup-storage/` directory is created automatically when needed. No manual setup required.

## Usage

### API Endpoints

#### Upload File
```
POST /api/files
Content-Type: multipart/form-data

Body:
- file: File (max 10MB)

Response:
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "id": "uuid",
    "filename": "timestamp-filename.ext",
    "originalFilename": "filename.ext",
    "mimeType": "image/png",
    "size": 12345,
    "storageType": "S3" | "LOCAL",
    "url": "https://..."
  }
}
```

#### Get File
```
GET /api/files/:id

Response:
Binary file with appropriate Content-Type header
```

#### Get File Info
```
GET /api/files/:id/info

Response:
{
  "success": true,
  "message": "File info retrieved successfully",
  "data": {
    "id": "uuid",
    "filename": "timestamp-filename.ext",
    "originalFilename": "filename.ext",
    "mimeType": "image/png",
    "size": 12345,
    "storageType": "S3" | "LOCAL",
    "url": "https://...",
    "createdAt": "2025-11-23T..."
  }
}
```

#### Delete File
```
DELETE /api/files/:id

Response:
{
  "success": true,
  "message": "File deleted successfully"
}
```

### Using in Forms

The `FileUpload` component is already integrated into:
- Transaction form (`TransactionFormPage`)
- Payment form (`PaymentFormPage`)

#### Example Usage:

```tsx
import { FileUpload } from "@/client/components";

function MyForm() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  return (
    <FileUpload
      onFileSelect={(file) => setSelectedFile(file)}
      onFileRemove={() => setSelectedFile(null)}
      selectedFile={selectedFile}
      accept="image/*,.pdf,.doc,.docx"
      maxSizeMB={10}
    />
  );
}
```

### Storage Flow

```
1. User uploads file → Handler receives FormData
2. Handler calls Service with file buffer
3. Service validates file (size, type)
4. Service tries S3 upload
   ├─ Success → Save to S3
   └─ Fail → Fallback to local storage
5. Service saves metadata to database
6. Returns file info with URL
```

## Architecture

### Layer Structure (Compliant with SERVER.md)

#### Handler Layer (`file.handler.ts`)
- ✅ Parses FormData from HTTP request
- ✅ Extracts userId from JWT
- ✅ Calls service methods
- ✅ Returns HTTP responses
- ❌ NO validation logic
- ❌ NO business logic

#### Service Layer (`file.service.ts`)
- ✅ Validates file size (10MB max)
- ✅ Manages database transactions (BEGIN/COMMIT/ROLLBACK)
- ✅ Orchestrates storage and database operations
- ✅ Passes client to repository
- ✅ Throws AppError for violations

#### Repository Layer (`file.repository.ts`)
- ✅ Has `mapRowToFile()` function (snake_case → camelCase)
- ✅ Accepts `PoolClient` as first parameter
- ✅ Executes SQL queries
- ❌ NO business logic
- ❌ NO transaction management

#### Storage Service (`storage.service.ts`)
- Independent service for file storage
- Tries S3 first, falls back to local
- Returns storage metadata

## S3-Compatible Providers

### AWS S3
```env
S3_ENDPOINT=https://s3.amazonaws.com
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=your-key
S3_SECRET_ACCESS_KEY=your-secret
S3_BUCKET=your-bucket
```

### MinIO (Self-hosted)
```env
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
S3_BUCKET=uploads
```

### DigitalOcean Spaces
```env
S3_ENDPOINT=https://nyc3.digitaloceanspaces.com
S3_REGION=nyc3
S3_ACCESS_KEY_ID=your-key
S3_SECRET_ACCESS_KEY=your-secret
S3_BUCKET=your-space-name
```

### Wasabi
```env
S3_ENDPOINT=https://s3.wasabisys.com
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=your-key
S3_SECRET_ACCESS_KEY=your-secret
S3_BUCKET=your-bucket
```

## Security

- Files are only accessible through authenticated API endpoints
- File size limited to 10MB (configurable in service)
- File type validation supported
- All uploads require valid JWT token
- Files stored with unique IDs to prevent overwrites

## Database Schema

### files table
```sql
- id: UUID (Primary Key)
- filename: VARCHAR(255) - Generated unique filename
- original_filename: VARCHAR(255) - User's original filename
- mime_type: VARCHAR(100) - File MIME type
- size: BIGINT - File size in bytes
- storage_type: VARCHAR(50) - 'S3' or 'LOCAL'
- storage_path: TEXT - Path/key in storage
- s3_bucket: VARCHAR(255) - S3 bucket name (if S3)
- s3_key: TEXT - S3 object key (if S3)
- created_at: TIMESTAMP
- created_by: UUID (Foreign Key → users)
```

### transactions.file_id
```sql
- file_id: UUID (Foreign Key → files, nullable)
```

### payments.file_id
```sql
- file_id: UUID (Foreign Key → files, nullable)
```

## Troubleshooting

### Files not uploading to S3
- Check S3 credentials in `.env`
- Verify bucket exists and has write permissions
- Check network connectivity to S3 endpoint
- System will automatically fall back to local storage

### Local storage issues
- Ensure application has write permissions
- Check disk space
- Verify `backup-storage/` directory is not blocked

### MIME type issues
- Browser determines MIME type
- Service accepts all types by default
- Configure `accept` prop on FileUpload component

## Future Enhancements

- [ ] Multiple file uploads
- [ ] Image thumbnail generation
- [ ] File compression
- [ ] CDN integration
- [ ] Virus scanning
- [ ] Storage quota management
