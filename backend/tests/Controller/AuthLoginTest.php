<?php

namespace App\Tests\Controller;

use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\HttpFoundation\Response;

class AuthLoginTest extends WebTestCase
{
    public function testLoginWithValidCredentialsReturnsJwt(): void
    {
        $client = static::createClient();
        $email = $this->registerUser($client);

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

        $data = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        self::assertArrayHasKey('token', $data);
        self::assertIsString($data['token']);
        self::assertNotSame('', $data['token']);
    }

    public function testLoginWithInvalidPasswordReturnsUnauthorized(): void
    {
        $client = static::createClient();
        $email = $this->registerUser($client);

        $client->request(
            'POST',
            '/api/login',
            server: ['CONTENT_TYPE' => 'application/json'],
            content: json_encode([
                'email' => $email,
                'password' => 'wrong-password',
            ], JSON_THROW_ON_ERROR),
        );

        self::assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }

    public function testMeWithoutTokenReturnsUnauthorized(): void
    {
        $client = static::createClient();

        $client->request('GET', '/api/me');

        self::assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }

    public function testMeWithValidTokenReturnsConnectedUser(): void
    {
        $client = static::createClient();
        $email = $this->registerUser($client);
        $token = $this->login($client, $email);

        $client->request(
            'GET',
            '/api/me',
            server: ['HTTP_AUTHORIZATION' => 'Bearer '.$token],
        );

        self::assertResponseStatusCodeSame(Response::HTTP_OK);

        $data = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        self::assertIsInt($data['id']);
        self::assertSame($email, $data['email']);
        self::assertSame('Bastien', $data['name']);
        self::assertContains('ROLE_USER', $data['roles']);
        self::assertArrayNotHasKey('password', $data);
    }

    private function registerUser(KernelBrowser $client): string
    {
        $email = sprintf('us02-%s@example.com', bin2hex(random_bytes(8)));

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

        return $email;
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

        $data = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        return $data['token'];
    }
}
