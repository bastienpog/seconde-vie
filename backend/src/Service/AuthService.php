<?php

namespace App\Service;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class AuthService
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly UserRepository $userRepository,
        private readonly UserPasswordHasherInterface $passwordHasher,
    ) {
    }

    public function register(?string $email, ?string $plainPassword): User
    {
        $email = strtolower(trim((string) $email));
        $plainPassword = (string) $plainPassword;

        if ($email === '') {
            throw new BadRequestHttpException('L\'email est obligatoire.');
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new BadRequestHttpException('L\'email n\'est pas valide.');
        }

        if ($plainPassword === '') {
            throw new BadRequestHttpException('Le mot de passe est obligatoire.');
        }

        if ($this->userRepository->findOneBy(['email' => $email]) !== null) {
            throw new ConflictHttpException('Cet email est déjà utilisé.');
        }

        $user = new User();
        $user->setEmail($email);
        $user->setRoles(['ROLE_USER']);
        $user->setPassword($this->passwordHasher->hashPassword($user, $plainPassword));

        $this->entityManager->persist($user);
        $this->entityManager->flush();

        return $user;
    }
}
