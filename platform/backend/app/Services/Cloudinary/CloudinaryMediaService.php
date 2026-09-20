<?php

namespace App\Services\Cloudinary;

use Cloudinary\Api\Utils;
use Cloudinary\Cloudinary;
use Cloudinary\Configuration\Configuration;
use Exception;
use Illuminate\Support\Facades\Log;

class CloudinaryMediaService
{
    public function __construct()
    {
        $url = config('cloudinary.cloud_url');

        if ($url) {
            Configuration::instance($url);
        } else {
            Configuration::instance([
                'cloud' => [
                    'cloud_name' => config('cloudinary.cloud_name'),
                    'api_key' => config('cloudinary.api_key'),
                    'api_secret' => config('cloudinary.api_secret'),
                ],
                'url' => [
                    'secure' => true,
                ],
            ]);
        }
    }

    /**
     * Generate an upload signature for direct browser upload.
     */
    public function generateUploadSignature(string $publicId, string $folder): array
    {
        $timestamp = time();

        $params = [
            'public_id' => $publicId,
            'folder' => $folder,
            'timestamp' => $timestamp,
        ];

        // Ensure we don't return the secret. Cloudinary SDK signs the params.
        $signature = Utils::api_sign_request($params, config('cloudinary.api_secret'));

        return [
            'cloud_name' => config('cloudinary.cloud_name'),
            'api_key' => config('cloudinary.api_key'),
            'timestamp' => $timestamp,
            'signature' => $signature,
            'public_id' => $publicId,
            'folder' => $folder,
        ];
    }

    /**
     * Generate an authenticated, short-lived delivery URL.
     */
    public function generateSignedDeliveryUrl(string $publicId): string
    {
        try {
            return Cloudinary::image($publicId)
                ->signUrl()
                ->toUrl();
        } catch (Exception $e) {
            Log::error('Failed to generate Cloudinary signed URL', ['error' => $e->getMessage()]);
            throw $e;
        }
    }
}
