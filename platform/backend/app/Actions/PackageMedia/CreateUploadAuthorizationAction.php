<?php

namespace App\Actions\PackageMedia;

use App\Models\Package;
use App\Models\PackageMediaUploadIntent;
use App\Services\Cloudinary\CloudinaryMediaService;
use Illuminate\Support\Str;

class CreateUploadAuthorizationAction
{
    protected CloudinaryMediaService $cloudinary;

    public function __construct(CloudinaryMediaService $cloudinary)
    {
        $this->cloudinary = $cloudinary;
    }

    /**
     * Generate Cloudinary upload authorization.
     *
     * @param  string  $packageId  UUID of the package
     * @param  string  $mediaId  UUID of the intended PackageMedia
     * @param  int  $businessId  the authorized business ID
     * @param  int  $userId  the authorized user ID
     */
    public function execute(string $packageId, string $mediaId, int $businessId, int $userId): array
    {
        $package = Package::where('id', $packageId)
            ->where('business_id', $businessId)
            ->firstOrFail();

        // Expire older intents for the same media
        PackageMediaUploadIntent::where('media_id', $mediaId)
            ->where('status', 'PENDING')
            ->update(['status' => 'EXPIRED']);

        $expectedPublicId = (string) Str::uuid();
        $folder = 'parkdrop/packages/'.md5((string) $businessId).'/'.$package->id;

        // Cloudinary's upload response returns public_id as the full
        // asset path (folder/public_id), not just the leaf id we pass in
        // — store the same full path here so CompleteUploadAction's match
        // check actually matches, instead of rejecting every real upload.
        $intent = PackageMediaUploadIntent::create([
            'package_id' => $package->id,
            'media_id' => $mediaId,
            'expected_public_id' => $folder.'/'.$expectedPublicId,
            'status' => 'PENDING',
            'created_by' => $userId,
            'expires_at' => now()->addMinutes(30),
        ]);

        return $this->cloudinary->generateUploadSignature($expectedPublicId, $folder);
    }
}
