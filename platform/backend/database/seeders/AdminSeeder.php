<?php

namespace Database\Seeders;

use App\Models\AdminUser;
use Illuminate\Database\Seeder;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        AdminUser::create([
            'email' => 'afutunde@gmail.com',
            'email_verified_at' => now(),
            'is_active' => true,
        ]);
    }
}
