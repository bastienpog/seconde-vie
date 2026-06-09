<?php

namespace App\Service;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;

class AccountService
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    public function deleteAccount(User $user): void
    {
        $this->entityManager->remove($user);
        $this->entityManager->flush();
    }
}
