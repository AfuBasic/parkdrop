<?php

namespace App\Services\Sync;

use App\Contracts\Sync\MutationHandler;
use InvalidArgumentException;

class MutationRegistry
{
    /**
     * @var array<string, MutationHandler>
     */
    protected array $handlers = [];

    public function register(MutationHandler $handler): void
    {
        $this->handlers[$handler->operation()] = $handler;
    }

    public function getHandler(string $operation): ?MutationHandler
    {
        return $this->handlers[$operation] ?? null;
    }
}
