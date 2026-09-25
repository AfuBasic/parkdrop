<?php

use App\Http\Controllers\Api\ViteController;
use Illuminate\Support\Facades\Route;

Route::get('/vite-manifest', [ViteController::class, 'manifest']);
Route::post('/build', [ViteController::class, 'build']);
