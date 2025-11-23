export interface UploadFileRequest {
  file: File;
}

export interface UploadFileResponse {
  id: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  size: number;
  storageType: 'S3' | 'LOCAL';
  url: string;
}

export interface GetFileResponse {
  id: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  size: number;
  storageType: 'S3' | 'LOCAL';
  url: string;
  createdAt: string;
}
