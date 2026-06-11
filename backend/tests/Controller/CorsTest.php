<?php

namespace App\Tests\Controller;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\HttpFoundation\Response;

class CorsTest extends WebTestCase
{
    public function testApiPreflightReturnsCorsHeaders(): void
    {
        $client = static::createClient();

        $client->request(
            'OPTIONS',
            '/api/register',
            server: [
                'HTTP_ORIGIN' => 'http://localhost:5173',
                'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'POST',
                'HTTP_ACCESS_CONTROL_REQUEST_HEADERS' => 'Content-Type',
            ],
        );

        self::assertResponseStatusCodeSame(Response::HTTP_NO_CONTENT);
        self::assertSame('http://localhost:5173', $client->getResponse()->headers->get('Access-Control-Allow-Origin'));
        self::assertSame('GET, POST, PUT, DELETE, OPTIONS', $client->getResponse()->headers->get('Access-Control-Allow-Methods'));
        self::assertSame('Content-Type, Authorization', $client->getResponse()->headers->get('Access-Control-Allow-Headers'));
    }

    public function testApiResponseReturnsCorsHeadersForAllowedOrigin(): void
    {
        $client = static::createClient();

        $client->request(
            'POST',
            '/api/register',
            server: [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_ORIGIN' => 'http://localhost:5173',
            ],
            content: json_encode([
                'email' => sprintf('cors-%s@example.com', bin2hex(random_bytes(8))),
                'password' => 'password123',
                'name' => 'Bastien',
            ], JSON_THROW_ON_ERROR),
        );

        self::assertResponseStatusCodeSame(Response::HTTP_CREATED);
        self::assertSame('http://localhost:5173', $client->getResponse()->headers->get('Access-Control-Allow-Origin'));
    }
}
