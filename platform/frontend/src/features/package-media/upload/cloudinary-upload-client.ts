export interface CloudinaryUploadParams {
  cloud_name: string;
  api_key: string;
  timestamp: number;
  signature: string;
  public_id: string;
  folder: string;
}

export interface CloudinaryUploadResponse {
  asset_id: string;
  public_id: string;
  version: number;
  version_id: string;
  signature: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  tags: string[];
  bytes: number;
  type: string;
  etag: string;
  placeholder: boolean;
  url: string;
  secure_url: string;
  original_filename: string;
}

export async function uploadToCloudinary(
  file: Blob,
  params: CloudinaryUploadParams
): Promise<CloudinaryUploadResponse> {
  const url = `https://api.cloudinary.com/v1_1/${params.cloud_name}/image/upload`;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', params.api_key);
  formData.append('timestamp', params.timestamp.toString());
  formData.append('signature', params.signature);
  formData.append('public_id', params.public_id);
  formData.append('folder', params.folder);

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cloudinary upload failed: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return response.json() as Promise<CloudinaryUploadResponse>;
}
