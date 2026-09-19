<?php

namespace App\Services\Media;

use Cloudinary\Cloudinary;
use Illuminate\Support\Facades\Config;

class CloudinaryMediaService
{
    protected Cloudinary $cloudinary;

    public function __construct()
    {
        $url = Config::get('cloudinary.cloud_url');
        if ($url) {
            $this->cloudinary = new Cloudinary($url);
        } else {
            $this->cloudinary = new Cloudinary([
                'cloud' => [
                    'cloud_name' => Config::get('cloudinary.cloud_name'),
                    'api_key'    => Config::get('cloudinary.api_key'),
                    'api_secret' => Config::get('cloudinary.api_secret'),
                ],
                'url' => [
                    'secure' => Config::get('cloudinary.secure', true),
                ]
            ]);
        }
    }

    /**
     * Generate signed upload parameters for direct browser upload.
     * 
     * @param string $folder The folder structure (e.g. parkdrop/businesses/xyz/pickup-points/123/packages)
     * @param string $publicId The predefined public ID for the asset (e.g. SHA-256 hash for idempotency)
     * @return array
     */
    public function generateSignedUploadParams(string $folder, string $publicId): array
    {
        $timestamp = time();

        $params = [
            'folder' => $folder,
            'public_id' => $publicId,
            'timestamp' => $timestamp,
            'resource_type' => 'image',
            'type' => 'authenticated', // Restrict delivery
            'overwrite' => true, // Ensure idempotency without erroring on duplicates
        ];

        // Generate the signature using the official SDK
        $apiSecret = Config::get('cloudinary.api_secret') ?: $this->getApiSecretFromUrl();
        $signature = \Cloudinary\Api\ApiUtils::signParameters($params, $apiSecret);

        return [
            'cloudName' => Config::get('cloudinary.cloud_name') ?: $this->getCloudNameFromUrl(),
            'apiKey' => Config::get('cloudinary.api_key') ?: $this->getApiKeyFromUrl(),
            'timestamp' => $timestamp,
            'signature' => $signature,
            'folder' => $folder,
            'publicId' => $publicId,
            'uploadParameters' => $params
        ];
    }
    
    /**
     * Extracts cloud_name from a CLOUDINARY_URL format string
     */
    protected function getCloudNameFromUrl(): ?string
    {
        $url = Config::get('cloudinary.cloud_url');
        if (!$url) return null;
        $parsed = parse_url($url);
        return $parsed['host'] ?? null;
    }
    
    /**
     * Extracts api_key from a CLOUDINARY_URL format string
     */
    protected function getApiKeyFromUrl(): ?string
    {
        $url = Config::get('cloudinary.cloud_url');
        if (!$url) return null;
        $parsed = parse_url($url);
        return $parsed['user'] ?? null;
    }
    
    /**
     * Extracts api_secret from a CLOUDINARY_URL format string
     */
    protected function getApiSecretFromUrl(): ?string
    {
        $url = Config::get('cloudinary.cloud_url');
        if (!$url) return null;
        $parsed = parse_url($url);
        return $parsed['pass'] ?? null;
    }
}
