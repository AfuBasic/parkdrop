<?php

use App\Actions\PackageMedia\CompleteUploadAction;
use App\Models\Business;
use App\Models\Customer;
use App\Models\Package;
use App\Models\PackageMedia;
use App\Models\PackageMediaUploadIntent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

function makePackageForCompleteUploadTest(): array
{
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
        'public_package_id' => 'PD-COMPLETE',
        'pickup_code' => 'ABC9999',
        'amount_due_minor' => 0,
        'status' => 'WAITING',
    ]);

    return [$business, $user, $package];
}

it('completes an upload whose response public_id includes the folder path, and saves it', function () {
    [$business, $user, $package] = makePackageForCompleteUploadTest();
    $mediaId = (string) Str::uuid();

    // Mirrors what Cloudinary's real upload response looks like: public_id
    // is the FULL asset path (folder/leafId), not just the leaf id that was
    // passed to CreateUploadAuthorizationAction.
    $fullPublicId = 'parkdrop/packages/'.md5((string) $business->id).'/'.$package->id.'/'.Str::uuid();

    PackageMediaUploadIntent::create([
        'package_id' => $package->id,
        'media_id' => $mediaId,
        'expected_public_id' => $fullPublicId,
        'status' => 'PENDING',
        'created_by' => $user->id,
        'expires_at' => now()->addMinutes(30),
    ]);

    $action = app(CompleteUploadAction::class);

    $media = $action->execute($package->id, $mediaId, [
        'public_id' => $fullPublicId,
        'asset_id' => 'asset123',
        'resource_type' => 'image',
        'format' => 'jpg',
        'width' => 100,
        'height' => 100,
        'bytes' => 12345,
    ], $business->id, $user->id);

    expect($media->status)->toBe('SYNCED')
        ->and($media->public_id)->toBe($fullPublicId)
        ->and($media->bytes)->toBe(12345);

    $this->assertDatabaseHas('package_media', [
        'id' => $mediaId,
        'public_id' => $fullPublicId,
        'status' => 'SYNCED',
    ]);
});

it('rejects a completion whose public_id does not match the authorized intent', function () {
    [$business, $user, $package] = makePackageForCompleteUploadTest();
    $mediaId = (string) Str::uuid();

    PackageMediaUploadIntent::create([
        'package_id' => $package->id,
        'media_id' => $mediaId,
        'expected_public_id' => 'parkdrop/packages/expected/path',
        'status' => 'PENDING',
        'created_by' => $user->id,
        'expires_at' => now()->addMinutes(30),
    ]);

    $action = app(CompleteUploadAction::class);

    expect(fn () => $action->execute($package->id, $mediaId, [
        'public_id' => 'parkdrop/packages/someone-elses/path',
    ], $business->id, $user->id))->toThrow(InvalidArgumentException::class);
});

it('is idempotent — completing an already-SYNCED media returns it without erroring', function () {
    [$business, $user, $package] = makePackageForCompleteUploadTest();
    $mediaId = (string) Str::uuid();

    PackageMedia::create([
        'id' => $mediaId,
        'business_id' => $business->id,
        'package_id' => $package->id,
        'public_id' => 'parkdrop/packages/already/synced',
        'status' => 'SYNCED',
        'created_by' => $user->id,
    ]);

    $action = app(CompleteUploadAction::class);

    $media = $action->execute($package->id, $mediaId, [
        'public_id' => 'parkdrop/packages/already/synced',
    ], $business->id, $user->id);

    expect($media->status)->toBe('SYNCED');
});
