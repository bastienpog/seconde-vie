<?php

namespace App\Service;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class AdminUserService
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly UserRepository $userRepository,
    ) {
    }

    public function promoteByEmail(mixed $email): User
    {
        $email = strtolower(trim((string) $email));

        if ($email === '') {
            throw new BadRequestHttpException("L'email est obligatoire.");
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new BadRequestHttpException("L'email n'est pas valide.");
        }

        $user = $this->userRepository->findOneBy(['email' => $email]);

        if (!$user instanceof User) {
            throw new NotFoundHttpException('Utilisateur introuvable.');
        }

        $roles = $user->getRoles();

        if (!in_array('ROLE_ADMIN', $roles, true)) {
            $roles[] = 'ROLE_ADMIN';
            $user->setRoles(array_values(array_unique($roles)));
            $this->entityManager->flush();
        }

        return $user;
    }

    /** @return array{id: int|null, email: string|null, name: string|null, roles: list<string>} */
    public function formatUser(User $user): array
    {
        return [
            'id' => $user->getId(),
            'email' => $user->getEmail(),
            'name' => $user->getName(),
            'roles' => $user->getRoles(),
        ];
    }
}
