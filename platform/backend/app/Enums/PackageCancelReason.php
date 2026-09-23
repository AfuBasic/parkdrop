<?php

namespace App\Enums;

enum PackageCancelReason: string
{
    case DUPLICATE_RECORD = 'DUPLICATE_RECORD';
    case CREATED_BY_MISTAKE = 'CREATED_BY_MISTAKE';
    case PACKAGE_NOT_RECEIVED = 'PACKAGE_NOT_RECEIVED';
    case WRONG_CUSTOMER = 'WRONG_CUSTOMER';
    case OTHER = 'OTHER';

    public function label(): string
    {
        return match ($this) {
            self::DUPLICATE_RECORD => 'Duplicate record',
            self::CREATED_BY_MISTAKE => 'Created by mistake',
            self::PACKAGE_NOT_RECEIVED => 'Package not received',
            self::WRONG_CUSTOMER => 'Wrong customer',
            self::OTHER => 'Other',
        };
    }
}
