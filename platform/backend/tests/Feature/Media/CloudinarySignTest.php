<?php

namespace Tests\Feature\Media;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Tests\TestCase;

class CloudinarySignTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Mock the Cloudinary config so we don't depend on .env during tests
        Config::set('cloudinary.cloud_name', 'test_cloud');
        Config::set('cloudinary.api_key', 'test_key');
        Config::set('cloudinary.api_secret', 'test_secret');
        Config::set('cloudinary.secure', true);
    }

    public function test_unauthenticated_user_cannot_access_endpoint(): void
    {
        $response = $this->postJson('/api/v1/media/cloudinary/sign', [
            'business_id' => 1,
            'pickup_point_id' => 2,
            'file_hash' => 'dummy_hash',
        ]);

        $response->assertStatus(401);
    }

    public function test_authenticated_user_can_generate_signature_without_exposing_secret(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/v1/media/cloudinary/sign', [
            'business_id' => 1,
            'pickup_point_id' => 2,
            'file_hash' => 'a_dummy_hash_xyz',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'already_uploaded',
                'cloudName',
                'apiKey',
                'timestamp',
                'signature',
                'folder',
                'publicId',
                'uploadParameters',
            ]);

        $json = $response->json();
        $this->assertEquals(false, $json['already_uploaded']);
        $this->assertEquals('test_cloud', $json['cloudName']);
        $this->assertEquals('test_key', $json['apiKey']);
        
        // Crucially, assert the secret is never leaked
        $this->assertArrayNotHasKey('apiSecret', $json);
        $this->assertArrayNotHasKey('api_secret', $json);
        $this->assertStringNotContainsString('test_secret', $response->getContent());
    }
}
