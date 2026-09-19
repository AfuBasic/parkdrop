<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

use App\Http\Controllers\Api\Media\CloudinarySignController;

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/v1/media/cloudinary/sign', [CloudinarySignController::class, 'sign']);
});
