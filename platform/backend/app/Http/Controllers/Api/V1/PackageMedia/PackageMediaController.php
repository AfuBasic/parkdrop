<?php

namespace App\Http\Controllers\Api\V1\PackageMedia;

use App\Actions\PackageMedia\CompleteUploadAction;
use App\Actions\PackageMedia\CreateUploadAuthorizationAction;
use App\Http\Controllers\Controller;
use App\Models\Package;
use App\Models\PackageMedia;
use App\Services\Cloudinary\CloudinaryMediaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PackageMediaController extends Controller
{
    public function authorizeUpload(Request $request, string $packageId, CreateUploadAuthorizationAction $action): JsonResponse
    {
        $request->validate([
            'business_id' => 'required|integer',
            'media_id' => 'required|uuid',
        ]);

        try {
            $response = $action->execute(
                $packageId,
                $request->input('media_id'),
                $request->input('business_id'),
                $request->user()->id
            );

            return response()->json($response);
        } catch (\Exception $e) {
            Log::error('Failed to authorize media upload', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Authorization failed.'], 403);
        }
    }

    public function completeUpload(Request $request, string $packageId, CompleteUploadAction $action): JsonResponse
    {
        $request->validate([
            'business_id' => 'required|integer',
            'media_id' => 'required|uuid',
            'cloudinary_response' => 'required|array',
        ]);

        try {
            $media = $action->execute(
                $packageId,
                $request->input('media_id'),
                $request->input('cloudinary_response'),
                $request->input('business_id'),
                $request->user()->id
            );

            return response()->json([
                'id' => $media->id,
                'status' => $media->status,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to complete media upload', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Verification failed.'], 400);
        }
    }

    public function view(Request $request, string $packageId, string $mediaId, CloudinaryMediaService $cloudinary): JsonResponse
    {
        // Simple auth check assuming request contains business_id and token
        $request->validate(['business_id' => 'required|integer']);
        
        $media = PackageMedia::where('id', $mediaId)
            ->where('package_id', $packageId)
            ->where('business_id', $request->input('business_id'))
            ->whereNotNull('public_id')
            ->firstOrFail();

        $url = $cloudinary->generateSignedDeliveryUrl($media->public_id);

        return response()->json(['url' => $url]);
    }
}
