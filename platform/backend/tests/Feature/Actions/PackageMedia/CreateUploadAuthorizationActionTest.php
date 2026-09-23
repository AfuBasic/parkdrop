<?php

use App\Actions\PackageMedia\CreateUploadAuthorizationAction;
use App\Models\Business;
use App\Models\Customer;
use App\Models\Package;
use App\Models\PackageMediaUploadIntent;
use App\Models\User;
use App\Services\Cloudinary\CloudinaryMediaService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

it('creates an upload intent and generates a signature', function () {
    $business = Business::create([
        'public_id' => (string) Str::uuid(),
        'name' => 'Media Test Business',
    ]);
    $user = User::factory()->create();
    $customer = Customer::create([
        'business_id' => $business->id,
        'name' => 'Media Customer',
        'phone_display' => '08012345678',
        'phone_normalized' => '+2348012345678',
        'version' => 1,
    ]);

    $package = Package::create([
        'id' => Str::uuid(),
        'business_id' => $business->id,
        'customer_id' => $customer->id,
        'public_package_id' => 'PD-TEST',
        'pickup_code' => 'ABC1234',
        'amount_due_minor' => 0,
        'status' => 'WAITING',
    ]);

    $mediaId = (string) Str::uuid();

    $mockCloudinary = Mockery::mock(CloudinaryMediaService::class);
    $mockCloudinary->shouldReceive('generateUploadSignature')
        ->once()
        ->andReturn([
            'cloud_name' => 'test_cloud',
            'api_key' => 'test_key',
            'timestamp' => time(),
            'signature' => 'test_sig',
            'public_id' => 'expected_public_id',
            'folder' => 'test_folder',
        ]);

    $action = new CreateUploadAuthorizationAction($mockCloudinary);

    $response = $action->execute($package->id, $mediaId, $business->id, $user->id);

    expect($response)->toHaveKey('signature')
        ->and(PackageMediaUploadIntent::count())->toBe(1)
        ->and(PackageMediaUploadIntent::first()->media_id)->toBe($mediaId)
        ->and(PackageMediaUploadIntent::first()->status)->toBe('PENDING');
});

it('stores the expected public_id as the full folder/publicId path, matching what Cloudinary actually returns', function () {
    // Cloudinary's upload response always returns public_id as the full
    // asset path (folder prefix included), never just the leaf id we send
    // it — CompleteUploadAction compares the two, so storing only the leaf
    // id here would make every real completion fail a "Public ID mismatch"
    // check that should never fire.
    $business = Business::create([
        'public_id' => (string) Str::uuid(),
        'name' => 'Media Test Business',
    ]);
    $user = User::factory()->create();
    $customer = Customer::create([
        'business_id' => $business->id,
        'name' => 'Media Customer',
        'phone_display' => '08012345678',
        'phone_normalized' => '+2348012345678',
        'version' => 1,
    ]);
    $package = Package::create([
        'id' => Str::uuid(),
        'business_id' => $business->id,
        'customer_id' => $customer->id,
        'public_package_id' => 'PD-TEST2',
        'pickup_code' => 'ABC1235',
        'amount_due_minor' => 0,
        'status' => 'WAITING',
    ]);
    $mediaId = (string) Str::uuid();

    $mockCloudinary = Mockery::mock(CloudinaryMediaService::class);
    $mockCloudinary->shouldReceive('generateUploadSignature')
        ->once()
        ->andReturnUsing(fn (string $publicId, string $folder) => [
            'cloud_name' => 'test_cloud',
            'api_key' => 'test_key',
            'timestamp' => time(),
            'signature' => 'test_sig',
            'public_id' => $publicId,
            'folder' => $folder,
        ]);

    $action = new CreateUploadAuthorizationAction($mockCloudinary);
    $response = $action->execute($package->id, $mediaId, $business->id, $user->id);

    $intent = PackageMediaUploadIntent::first();

    expect($intent->expected_public_id)
        ->toBe($response['folder'].'/'.$response['public_id']);
});
