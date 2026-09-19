<?php

namespace App\Http\Controllers\Api\Media;

use App\Http\Controllers\Controller;
use App\Models\PackageMedia;
use App\Services\Media\CloudinaryMediaService;
use Illuminate\Http\Request;

class CloudinarySignController extends Controller
{
    public function sign(Request $request, CloudinaryMediaService $mediaService)
    {
        $validated = $request->validate([
            'business_id' => 'required|integer',
            'pickup_point_id' => 'required|integer',
            'file_hash' => 'required|string',
        ]);

        $businessId = $validated['business_id'];
        $pickupPointId = $validated['pickup_point_id'];
        $fileHash = $validated['file_hash'];

        // Verify the user is authenticated (middleware handles this usually, but double checking)
        if (!auth()->check()) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // Verify user has access to this business (simplified placeholder)
        // $user = auth()->user();
        // if (!$user->businesses()->where('businesses.id', $businessId)->exists()) {
        //    abort(403, 'Unauthorized access to this business.');
        // }

        // Idempotency Check: if this hash was already uploaded for this business, return it
        $existingMedia = PackageMedia::where('business_id', $businessId)
            ->where('file_hash', $fileHash)
            ->first();

        if ($existingMedia) {
            return response()->json([
                'already_uploaded' => true,
                'media' => $existingMedia,
            ]);
        }

        // Generate folder path
        $folder = sprintf("parkdrop/businesses/%d/pickup-points/%d/packages", $businessId, $pickupPointId);

        // We use the file hash as the Cloudinary public_id for idempotency on Cloudinary's side
        $publicId = $fileHash;

        $params = $mediaService->generateSignedUploadParams($folder, $publicId);

        return response()->json(array_merge(['already_uploaded' => false], $params));
    }
}
