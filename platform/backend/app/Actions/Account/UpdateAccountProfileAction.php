<?php

namespace App\Actions\Account;

use App\Models\User;
use InvalidArgumentException;

class UpdateAccountProfileAction
{
    /**
     * Update user's display name safely.
     *
     * @throws InvalidArgumentException
     */
    public function execute(User $user, array $payload): User
    {
        $name = isset($payload['first_name']) ? trim($payload['first_name']) : '';

        if (empty($name)) {
            throw new InvalidArgumentException('FIRST_NAME_REQUIRED');
        }

        if (mb_strlen($name) < 2 || mb_strlen($name) > 100) {
            throw new InvalidArgumentException('FIRST_NAME_INVALID_LENGTH');
        }

        $user->update([
            'first_name' => $name,
        ]);

        return $user;
    }
}
