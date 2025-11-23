import { NextRequest, NextResponse } from "next/server";
import { createFileService } from "../services/file.service";
import { AppError, getUserIdFromRequest, createBaseResponse } from "../utils";

export class FileHandler {
  private fileService = createFileService();

  async uploadFile(request: NextRequest): Promise<NextResponse> {
    try {
      // Parse request (HTTP concerns only)
      const userId = getUserIdFromRequest(request);
      const formData = await request.formData();
      const file = formData.get("file") as File;

      if (!file) {
        throw new AppError("No file provided", 400);
      }

      // Convert file to buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Call service (validation happens in service)
      const result = await this.fileService.uploadFile(
        buffer,
        file.name,
        file.type,
        userId
      );

      return NextResponse.json(
        {
          ...createBaseResponse("File uploaded successfully"),
          data: result,
        },
        { status: 201 }
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getFile(request: NextRequest, id: string): Promise<NextResponse> {
    try {
      const { file, mimeType, filename } = await this.fileService.getFile(id);

      return new NextResponse(new Uint8Array(file), {
        status: 200,
        headers: {
          "Content-Type": mimeType,
          "Content-Disposition": `inline; filename="${filename}"`,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getFileInfo(request: NextRequest, id: string): Promise<NextResponse> {
    try {
      const fileInfo = await this.fileService.getFileInfo(id);

      return NextResponse.json(
        {
          ...createBaseResponse("File info retrieved successfully"),
          data: fileInfo,
        },
        { status: 200 }
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async deleteFile(request: NextRequest, id: string): Promise<NextResponse> {
    try {
      await this.fileService.deleteFile(id);

      return NextResponse.json(
        {
          ...createBaseResponse("File deleted successfully"),
        },
        { status: 200 }
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  private handleError(error: unknown): NextResponse {
    if (error instanceof AppError) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: error.statusCode }
      );
    }

    console.error("Unexpected error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}

export const fileHandler = new FileHandler();
