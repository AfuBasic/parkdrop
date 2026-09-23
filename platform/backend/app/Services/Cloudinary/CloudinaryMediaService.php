<?php

namespace App\Services\Cloudinary;

use Cloudinary\Api\ApiUtils;
use Cloudinary\Cloudinary;
use Cloudinary\Configuration\Configuration;
use Illuminate\Support\Facades\Log;
use Throwable;

class CloudinaryMediaService
{
    protected Cloudinary $cloudinary;

    public function __construct()
    {
        $url = config('cloudinary.cloud_url');

        $configuration = $url
            ? Configuration::instance($url)
            : Configuration::instance([
                'cloud' => [
                    'cloud_name' => config('cloudinary.cloud_name'),
                    'api_key' => config('cloudinary.api_key'),
                    'api_secret' => config('cloudinary.api_secret'),
                ],
                'url' => [
                    'secure' => true,
                ],
            ]);

        $this->cloudinary = new Cloudinary($configuration);
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
        // (v1 SDK's Utils::api_sign_request no longer exists in v3 — this is
        // its replacement. The old, nonexistent class silently threw a
        // fatal `Error` on every authorize call, which is not caught by the
        // controller's `catch (\Exception $e)`, so this endpoint was 500ing
        // outright — the actual reason uploads never reached Cloudinary.)
        $signature = ApiUtils::signParameters($params, config('cloudinary.api_secret'));

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
            // Cloudinary::image() is an instance method (needs a configured
            // Cloudinary object) — calling it statically, as this did
            // before, is a fatal `Error`, not caught by `catch (Exception)`.
            return (string) $this->cloudinary->image($publicId)
                ->signUrl()
                ->toUrl();
        } catch (Throwable $e) {
            Log::error('Failed to generate Cloudinary signed URL', ['error' => $e->getMessage()]);
            throw $e;
        }
    }
}
