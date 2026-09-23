<?php

namespace App\Actions\PackageMedia;

use App\Models\Package;
use App\Models\PackageMedia;
use App\Models\PackageMediaUploadIntent;
use App\Models\SyncChange;
use Cloudinary\Utils\SignatureVerifier;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use InvalidArgumentException;

class CompleteUploadAction
{
    /**
     * Verify and complete the media upload based on Cloudinary response.
     */
    public function execute(string $packageId, string $mediaId, array $cloudinaryResponse, int $businessId, int $userId): PackageMedia
    {
        $intent = PackageMediaUploadIntent::where('media_id', $mediaId)
            ->where('package_id', $packageId)
            ->where('status', 'PENDING')
            ->where('expires_at', '>', now())
            ->first();

        // If intent doesn't exist or is expired, we might still accept it if it's already completed idempotently.
        if (! $intent) {
            $existingMedia = PackageMedia::where('id', $mediaId)->where('package_id', $packageId)->first();
            if ($existingMedia && $existingMedia->status === 'SYNCED') {
                return $existingMedia; // Idempotent completion
            }
            throw new Exception('No valid upload intent found or intent expired.');
        }

        // Verify public_id matches our intent
        $providerPublicId = $cloudinaryResponse['public_id'] ?? null;
        if ($providerPublicId !== $intent->expected_public_id) {
            throw new InvalidArgumentException('Public ID mismatch.');
        }

        // Best-effort verification that the Cloudinary response wasn't
        // tampered with in transit — we still trust the intent (expiring,
        // single-use, public_id already matched above) as the primary
        // guard, so a missing/mismatched signature only gets logged, not
        // rejected. (This previously called a v1-SDK class —
        // `Cloudinary\Api\Utils::api_sign_request` — that no longer exists
        // in the installed v3 SDK, so every completeUpload() call threw an
        // uncaught fatal `Error` here, on top of authorizeUpload() already
        // failing the same way — see CloudinaryMediaService.)
        if (isset($cloudinaryResponse['signature'], $cloudinaryResponse['version'])) {
            $signatureValid = SignatureVerifier::verifyApiResponseSignature(
                $providerPublicId,
                $cloudinaryResponse['version'],
                $cloudinaryResponse['signature']
            );

            if (! $signatureValid) {
                Log::warning('Cloudinary upload response signature mismatch.', [
                    'media_id' => $mediaId,
                    'package_id' => $packageId,
                ]);
            }
        }

        return DB::transaction(function () use ($intent, $packageId, $mediaId, $cloudinaryResponse, $businessId, $userId) {
            // Re-verify package business
            $package = Package::where('id', $packageId)->where('business_id', $businessId)->lockForUpdate()->firstOrFail();

            $media = PackageMedia::updateOrCreate(
                ['id' => $mediaId],
                [
                    'business_id' => $businessId,
                    'package_id' => $packageId,
                    'cloudinary_asset_id' => $cloudinaryResponse['asset_id'] ?? null,
                    'public_id' => $cloudinaryResponse['public_id'] ?? null,
                    'status' => 'SYNCED',
                    'resource_type' => $cloudinaryResponse['resource_type'] ?? 'image',
                    'format' => $cloudinaryResponse['format'] ?? null,
                    'width' => $cloudinaryResponse['width'] ?? null,
                    'height' => $cloudinaryResponse['height'] ?? null,
                    'bytes' => $cloudinaryResponse['bytes'] ?? null,
                    'created_by' => $userId,
                ]
            );

            // Mark intent completed
            $intent->update(['status' => 'COMPLETED']);

            // Broadcast sync change
            SyncChange::create([
                'entity_type' => 'package_media',
                'entity_id' => $mediaId,
                'business_id' => $businessId,
                'operation' => 'UPSERT',
                'entity_version' => 1,
            ]);

            return $media;
        });
    }
}
