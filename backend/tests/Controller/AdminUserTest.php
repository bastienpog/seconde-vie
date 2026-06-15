<?php

namespace App\Tests\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\HttpFoundation\Response;

class AdminUserTest extends WebTestCase
{
    public function testPromoteUserRequiresAuthentication(): void
    {
        $client = static::createClient();

        $client->request(
            'POST',
            '/api/admin/users/promote',
            server: ['CONTENT_TYPE' => 'application/json'],
            content: json_encode(['email' => 'user@example.com'], JSON_THROW_ON_ERROR),
        );

        self::assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }

    public function testPromoteUserRequiresAdminRole(): void
    {
        $client = static::createClient();
        $user = $this->createUser($client);

        $client->request(
            'POST',
            '/api/admin/users/promote',
            server: [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer '.$user['token'],
            ],
            content: json_encode(['email' => $user['email']], JSON_THROW_ON_ERROR),
        );

        self::assertResponseStatusCodeSame(Response::HTTP_FORBIDDEN);
    }

    public function testAdminCanPromoteUser(): void
    {
        $client = static::createClient();
        $admin = $this->createUser($client, ['ROLE_ADMIN']);
        $user = $this->createUser($client);

        $client->request(
            'POST',
            '/api/admin/users/promote',
            server: [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer '.$admin['token'],
            ],
            content: json_encode(['email' => strtoupper($user['email'])], JSON_THROW_ON_ERROR),
        );

        self::assertResponseIsSuccessful();
        $data = $this->decodeResponse($client);
        self::assertSame($user['email'], $data['email']);
        self::assertContains('ROLE_ADMIN', $data['roles']);

        $promotedUser = self::getContainer()->get(UserRepository::class)->find($user['user']->getId());
        self::assertInstanceOf(User::class, $promotedUser);
        self::assertContains('ROLE_ADMIN', $promotedUser->getRoles());
    }

    public function testPromoteUserValidatesEmail(): void
    {
        $client = static::createClient();
        $admin = $this->createUser($client, ['ROLE_ADMIN']);

        $client->request(
            'POST',
            '/api/admin/users/promote',
            server: [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer '.$admin['token'],
            ],
            content: json_encode(['email' => 'email-invalide'], JSON_THROW_ON_ERROR),
        );

        self::assertResponseStatusCodeSame(Response::HTTP_BAD_REQUEST);
    }

    public function testPromoteUnknownUserReturnsNotFound(): void
    {
        $client = static::createClient();
        $admin = $this->createUser($client, ['ROLE_ADMIN']);

        $client->request(
            'POST',
            '/api/admin/users/promote',
            server: [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer '.$admin['token'],
            ],
            content: json_encode(['email' => 'unknown-'.bin2hex(random_bytes(4)).'@example.com'], JSON_THROW_ON_ERROR),
        );

        self::assertResponseStatusCodeSame(Response::HTTP_NOT_FOUND);
    }

    /**
     * @param list<string> $roles
     * @return array{user: User, token: string, email: string}
     */
    private function createUser(KernelBrowser $client, array $roles = ['ROLE_USER']): array
    {
        $email = sprintf('admin-user-%s@example.com', bin2hex(random_bytes(8)));

        $client->request(
            'POST',
            '/api/register',
            server: ['CONTENT_TYPE' => 'application/json'],
            content: json_encode([
                'email' => $email,
                'password' => 'password123',
                'name' => 'Bastien',
            ], JSON_THROW_ON_ERROR),
        );

        self::assertResponseStatusCodeSame(Response::HTTP_CREATED);

        $entityManager = self::getContainer()->get(EntityManagerInterface::class);
        $user = self::getContainer()->get(UserRepository::class)->findOneBy(['email' => $email]);
        self::assertInstanceOf(User::class, $user);
        $user->setRoles($roles);
        $entityManager->flush();

        return [
            'user' => $user,
            'token' => $this->login($client, $email),
            'email' => $email,
        ];
    }

    private function login(KernelBrowser $client, string $email): string
    {
        $client->request(
            'POST',
            '/api/login',
            server: ['CONTENT_TYPE' => 'application/json'],
            content: json_encode([
                'email' => $email,
                'password' => 'password123',
            ], JSON_THROW_ON_ERROR),
        );

        self::assertResponseStatusCodeSame(Response::HTTP_OK);
        $data = $this->decodeResponse($client);

        return $data['token'];
    }

    /** @return array<string, mixed> */
    private function decodeResponse(KernelBrowser $client): array
    {
        return json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
    }
}
