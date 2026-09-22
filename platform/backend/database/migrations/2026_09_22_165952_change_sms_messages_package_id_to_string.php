<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * package_id was created as unsignedBigInteger, but packages.id is a UUID
     * string — the column could never actually reference a package. Raw SQL
     * (not Schema::table()->change()) to avoid a doctrine/dbal dependency.
     */
    public function up(): void
    {
        DB::statement('ALTER TABLE sms_messages MODIFY package_id VARCHAR(36) NULL');
    }

    public function down(): void
    {
        DB::statement('UPDATE sms_messages SET package_id = NULL WHERE package_id IS NOT NULL AND package_id NOT REGEXP \'^[0-9]+$\'');
        DB::statement('ALTER TABLE sms_messages MODIFY package_id BIGINT UNSIGNED NULL');
    }
};
