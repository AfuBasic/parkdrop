<?php

namespace App\Enums;

enum PackageReturnReason: string
{
    case CUSTOMER_DID_NOT_COLLECT = 'CUSTOMER_DID_NOT_COLLECT';
    case RETURNED_TO_SENDER = 'RETURNED_TO_SENDER';
    case WRONG_DESTINATION = 'WRONG_DESTINATION';
    case DAMAGED = 'DAMAGED';
    case OTHER = 'OTHER';

    public function label(): string
    {
        return match ($this) {
            self::CUSTOMER_DID_NOT_COLLECT => 'Customer did not collect',
            self::RETURNED_TO_SENDER => 'Returned to sender',
            self::WRONG_DESTINATION => 'Wrong destination',
            self::DAMAGED => 'Damaged',
            self::OTHER => 'Other',
        };
    }
}
