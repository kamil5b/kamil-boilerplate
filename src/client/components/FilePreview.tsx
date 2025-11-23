"use client";

import { useState, useEffect } from "react";
import { Download, File, Image, FileText, FileSpreadsheet } from "lucide-react";

interface FilePreviewProps {
  fileId: string;
  className?: string;
}

export function FilePreview({ fileId, className = "" }: FilePreviewProps) {
  const [fileInfo, setFileInfo] = useState<{
    originalFilename: string;
    mimeType: string;
    size: number;
    url: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/files/${fileId}/info`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load file info");
        return res.json();
      })
      .then((data) => {
        setFileInfo(data.data);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setIsLoading(false);
      });
  }, [fileId]);

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return Image;
    if (mimeType.includes("pdf")) return FileText;
    if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return FileSpreadsheet;
    return File;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  if (isLoading) {
    return (
      <div className={`p-3 bg-gray-50 rounded ${className}`}>
        <span className="text-sm text-gray-500">Loading file info...</span>
      </div>
    );
  }

  if (error || !fileInfo) {
    return (
      <div className={`p-3 bg-red-50 rounded ${className}`}>
        <span className="text-sm text-red-600">Failed to load file</span>
      </div>
    );
  }

  const Icon = getFileIcon(fileInfo.mimeType);
  const isImage = fileInfo.mimeType.startsWith("image/");

  return (
    <div className={`space-y-3 ${className}`}>
      {/* File Info Card */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0 p-2 bg-white rounded">
              <Icon className="w-6 h-6 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {fileInfo.originalFilename}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {formatFileSize(fileInfo.size)}
              </p>
            </div>
          </div>
          <a
            href={`/api/files/${fileId}`}
            download={fileInfo.originalFilename}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download
          </a>
        </div>
      </div>

      {/* Image Preview */}
      {isImage && (
        <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
          <img
            src={`/api/files/${fileId}`}
            alt={fileInfo.originalFilename}
            className="w-full h-auto max-h-96 object-contain"
            loading="lazy"
          />
        </div>
      )}
    </div>
  );
}
