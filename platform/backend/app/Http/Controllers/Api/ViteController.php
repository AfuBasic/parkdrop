<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\File;
use Inertia\Ssr\HtmlTagTransformer;

class ViteController extends Controller
{
    public function manifest(): JsonResponse
    {
        $devServerUrl = env('VITE_DEV_SERVER_URL');

        if ($devServerUrl && class_exists(HtmlTagTransformer::class)) {
            return response()->json([
                'url' => $devServerUrl,
            ]);
        }

        $manifestPath = public_path('build/manifest.json');

        if (!File::exists($manifestPath)) {
            return response()->json([], 404);
        }

        return response()->json(json_decode(File::get($manifestPath), true));
    }

    public function build(): JsonResponse
    {
        $exitCode = 0;

        if (class_exists(HtmlTagTransformer::class)) {
            passthru('cd ' . escapeshellarg(base_path()) . ' && npm run build 2>&1', $exitCode);
        }

        return response()->json(['success' => $exitCode === 0, 'exit_code' => $exitCode]);
    }
}
