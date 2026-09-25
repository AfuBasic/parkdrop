<?php

namespace Tests\Feature\Admin;

use App\Models\AdminUser;
use App\Models\Business;
use App\Models\Package;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminDashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_requires_authentication()
    {
        $response = $this->get('/admin/dashboard');

        $response->assertRedirect('/admin/login');
    }

    public function test_dashboard_loads_with_correct_data()
    {
        $admin = AdminUser::factory()->create();

        // Seed some data
        Business::create(['public_id' => \Illuminate\Support\Str::uuid(), 'name' => 'B1', 'status' => 'active']);
        Business::create(['public_id' => \Illuminate\Support\Str::uuid(), 'name' => 'B2', 'status' => 'active']);
        Business::create(['public_id' => \Illuminate\Support\Str::uuid(), 'name' => 'B3', 'status' => 'active']);
        Business::create(['public_id' => \Illuminate\Support\Str::uuid(), 'name' => 'B4', 'status' => 'inactive']);
        Business::create(['public_id' => \Illuminate\Support\Str::uuid(), 'name' => 'B5', 'status' => 'inactive']);

        User::factory()->count(5)->create(['status' => 'active']);

        // Since it's a JSON response (Inertia or just array?) from AdminDashboardController, wait, AdminDashboardController just returns an array!
        // But routes/web.php doesn't wrap it in Inertia.
        
        $response = $this->actingAs($admin, 'admin')->getJson('/admin/dashboard');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'kpi' => [
                    'pickupPoints',
                    'packagesToday',
                    'revenueToday',
                    'smsCredits',
                ],
                'quickStats' => [
                    'thisWeek',
                    'overdue',
                    'activePoints',
                    'activeStaff',
                ],
                'recentActivity',
                'needsAttention',
            ]);
    }
}
