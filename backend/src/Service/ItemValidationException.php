<?php

namespace App\Service;

class ItemValidationException extends \RuntimeException
{
    /**
     * @param array<string, string> $details
     */
    public function __construct(private readonly array $details)
    {
        parent::__construct('Invalid data');
    }

    /**
     * @return array<string, string>
     */
    public function getDetails(): array
    {
        return $this->details;
    }
}
