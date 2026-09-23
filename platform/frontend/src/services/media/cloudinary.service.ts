export interface CloudinaryUploadResponse {
  asset_id: string;
  public_id: string;
  version: number;
  width: number;
  height: number;
  format: string;
  bytes: number;
  secure_url: string;
}

export interface SignatureResponse {
  already_uploaded: boolean;
  media?: any; // The existing media record from backend if already uploaded
  cloudName?: string;
  apiKey?: string;
  timestamp?: number;
  signature?: string;
  folder?: string;
  publicId?: string;
  uploadParameters?: Record<string, string | number | boolean>;
}

/**
 * Computes a SHA-256 hash for a given Blob.
 * Used for idempotency to ensure duplicate uploads are prevented.
 */
export async function computeHash(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Uploads a blob to Cloudinary using a backend-generated signature,
 * with idempotency checks based on the file hash.
 */
export async function uploadPackageMedia(
  blob: Blob,
  businessId: number,
  pickupPointId: number
): Promise<CloudinaryUploadResponse | any> {
  // 1. Compute hash
  const fileHash = await computeHash(blob);

  // 2. Request signature from Laravel
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  
  // Note: in a real application, Axios or a configured fetch client would automatically
  // handle attaching the Sanctum CSRF token or Bearer token.
  const token = localStorage.getItem('auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Uses relative path, assuming Vite proxy or relative deployment to backend
  const signReq = await fetch('/api/v1/media/cloudinary/sign', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      business_id: businessId,
      pickup_point_id: pickupPointId,
      file_hash: fileHash,
    })
  });

  if (!signReq.ok) {
    throw new Error('Failed to obtain upload signature from backend');
  }

  const signData: SignatureResponse = await signReq.json();

  // 3. Idempotency Check: if already uploaded, return the existing asset directly
  if (signData.already_uploaded) {
    return signData.media;
  }

  // 4. Perform direct upload to Cloudinary
  const { cloudName, apiKey, timestamp, signature, folder, publicId, uploadParameters } = signData;
  
  if (!cloudName) {
    throw new Error('Missing cloudName from signature response');
  }

  const formData = new FormData();
  formData.append('file', blob);
  formData.append('api_key', apiKey as string);
  formData.append('timestamp', timestamp!.toString());
  formData.append('signature', signature as string);
  formData.append('folder', folder as string);
  formData.append('public_id', publicId as string);

  // Append any extra restricted parameters specified by the server (e.g. resource_type)
  if (uploadParameters) {
    for (const [key, value] of Object.entries(uploadParameters)) {
      if (!['folder', 'public_id', 'timestamp'].includes(key)) {
        formData.append(key, value.toString());
      }
    }
  }

  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const uploadReq = await fetch(uploadUrl, {
    method: 'POST',
    body: formData,
  });

  if (!uploadReq.ok) {
    throw new Error('Cloudinary upload failed');
  }

  const uploadResult: CloudinaryUploadResponse = await uploadReq.json();
  
  // Return the normalized upload metadata. 
  // In a full flow, this metadata would then be sent back to Laravel to attach to the package.
  return uploadResult;
}
