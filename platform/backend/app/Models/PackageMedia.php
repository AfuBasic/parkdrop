<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PackageMedia extends Model
{
    protected $fillable = [
        'business_id',
        'package_id',
        'cloudinary_public_id',
        'file_hash',
        'resource_type',
        'format',
        'width',
        'height',
        'bytes',
        'created_by',
    ];
}
