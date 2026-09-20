<?php

namespace App\Enums;

enum PaymentMethod: string
{
    case CASH = 'CASH';
    case TRANSFER = 'TRANSFER';
    case POS = 'POS';
    case OTHER = 'OTHER';

    public function label(): string
    {
        return match ($this) {
            self::CASH => 'Cash',
            self::TRANSFER => 'Transfer',
            self::POS => 'POS',
            self::OTHER => 'Other',
        };
    }
}
