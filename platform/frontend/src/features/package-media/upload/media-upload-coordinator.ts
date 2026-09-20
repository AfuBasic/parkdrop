import { db } from '../../offline/db/database';
import { api } from '../../../utils/api';
import { uploadToCloudinary, type CloudinaryUploadParams, type CloudinaryUploadResponse } from './cloudinary-upload-client';

export class MediaUploadCoordinator {
  static async syncPendingMedia(businessId: number): Promise<void> {
    // 1. Get all pending media for this business
    const pendingMedia = await db.packageMedia
      .where('business_id')
      .equals(businessId)
      .toArray();

    const toProcess = pendingMedia.filter(
      (m) =>
        m.status === 'PENDING_UPLOAD' ||
        m.status === 'AUTHORIZING' ||
        m.status === 'UPLOADING' ||
        m.status === 'FAILED_RETRYABLE'
    );

    for (const media of toProcess) {
      try {
        // Ensure package is synced first
        const pkg = await db.packages.get(media.package_id);
        if (!pkg) {
          await this.markFailed(media.id, 'Package not found locally', false);
          continue;
        }

        if (pkg.sync_status !== 'SYNCED') {
          // Package hasn't synced yet, we can't upload media to a non-existent server package
          console.log(`Media ${media.id} waiting for package ${pkg.id} to sync.`);
          continue;
        }

        if (!media.local_blob) {
          await this.markFailed(media.id, 'No local blob found', false);
          continue;
        }

        // 2. Request Authorization
        await db.packageMedia.update(media.id, { status: 'AUTHORIZING' });
        
        const authResponse = await api.post(`/packages/${pkg.id}/media/authorize`, {
          business_id: businessId,
          media_id: media.id,
        });

        const authParams = authResponse.data as CloudinaryUploadParams;

        // 3. Upload to Cloudinary
        await db.packageMedia.update(media.id, { status: 'UPLOADING', attempt_count: media.attempt_count + 1, last_attempt_at: new Date().toISOString() });
        
        const uploadResponse = await uploadToCloudinary(media.local_blob, authParams);

        // 4. Complete Upload Verification
        await db.packageMedia.update(media.id, { status: 'VERIFYING' });
        
        await api.post(`/packages/${pkg.id}/media/complete`, {
          business_id: businessId,
          media_id: media.id,
          cloudinary_response: uploadResponse,
        });

        // 5. Finalize: Remove local blob to save space, mark SYNCED
        await db.packageMedia.update(media.id, {
          status: 'SYNCED',
          local_blob: undefined, // Free memory/storage
          cloudinary_asset_id: uploadResponse.asset_id,
          public_id: uploadResponse.public_id,
        });

      } catch (error: any) {
        console.error(`Media sync failed for ${media.id}`, error);
        await this.markFailed(media.id, error.message || 'Unknown error', true);
      }
    }
  }

  private static async markFailed(mediaId: string, errorSafe: string, retryable: boolean) {
    await db.packageMedia.update(mediaId, {
      status: retryable ? 'FAILED_RETRYABLE' : 'NEEDS_ATTENTION',
      last_error_safe: errorSafe,
    });
  }
}
