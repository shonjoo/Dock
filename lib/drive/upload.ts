import { Readable } from "node:stream";
import type { drive_v3 } from "googleapis";
import { getDriveClient } from "./client";

export interface UploadStreamParams {
  filename: string;
  mimeType: string;
  folderId: string;
  bodyStream: Readable;
}

export interface UploadResult {
  fileId: string;
  name: string;
  webViewLink?: string | null;
  mimeType?: string | null;
  size?: string | null;
}

/**
 * Streams an attachment directly to a target Drive folder without buffering whole files in memory.
 * CRITICAL RULE: appProperties.source must be set to "discord" to break feedback loops.
 */
export async function uploadStreamToDrive(
  params: UploadStreamParams,
  drive: drive_v3.Drive = getDriveClient()
): Promise<UploadResult> {
  const fileMetadata: drive_v3.Schema$File = {
    name: params.filename,
    parents: [params.folderId],
    appProperties: {
      source: "discord",
    },
  };

  const media = {
    mimeType: params.mimeType,
    body: params.bodyStream,
  };

  const res = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: "id, name, webViewLink, mimeType, size, appProperties",
    supportsAllDrives: true,
  });

  const file = res.data;
  if (!file.id) {
    throw new Error(`Failed to upload file to Google Drive: no file ID returned`);
  }

  return {
    fileId: file.id,
    name: file.name || params.filename,
    webViewLink: file.webViewLink,
    mimeType: file.mimeType,
    size: file.size,
  };
}
