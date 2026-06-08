<?php

namespace App\Tests\Controller;

use App\Entity\Category;
use App\Entity\Item;
use App\Repository\ItemRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\HttpFoundation\Response;

class ItemCreateTest extends WebTestCase
{
    public function testCreateItemWithValidTokenReturnsCreated(): void
    {
        $client = static::createClient();
        $email = $this->registerUser($client);
        $token = $this->login($client, $email);
        $category = $this->createCategory('Bricolage');

        $client->request(
            'POST',
            '/api/items',
            server: [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer '.$token,
            ],
            content: json_encode($this->validPayload($category->getId()), JSON_THROW_ON_ERROR),
        );

        self::assertResponseStatusCodeSame(Response::HTTP_CREATED);

        $data = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        self::assertIsInt($data['id']);
        self::assertSame('Perceuse Bosch', $data['title']);
        self::assertSame('Paris', $data['city']);
        self::assertSame('Bon état', $data['condition']);
        self::assertSame('https://example.com/image.jpg', $data['imageUrl']);
        self::assertSame('available', $data['status']);
        self::assertSame($category->getId(), $data['category']['id']);
        self::assertSame('Bricolage', $data['category']['name']);
        self::assertSame($email, $data['owner']['email']);
        self::assertArrayHasKey('createdAt', $data);
    }

    public function testCreateItemWithoutTokenReturnsUnauthorized(): void
    {
        $client = static::createClient();

        $client->request(
            'POST',
            '/api/items',
            server: ['CONTENT_TYPE' => 'application/json'],
            content: json_encode($this->validPayload(1), JSON_THROW_ON_ERROR),
        );

        self::assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }

    public function testCreateItemWithInvalidDataReturnsBadRequest(): void
    {
        $client = static::createClient();
        $email = $this->registerUser($client);
        $token = $this->login($client, $email);
        $category = $this->createCategory('Maison');

        $payload = $this->validPayload($category->getId());
        $payload['title'] = '';
        $payload['description'] = '';
        $payload['condition'] = '';

        $client->request(
            'POST',
            '/api/items',
            server: [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer '.$token,
            ],
            content: json_encode($payload, JSON_THROW_ON_ERROR),
        );

        self::assertResponseStatusCodeSame(Response::HTTP_BAD_REQUEST);

        $data = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        self::assertSame('Invalid data', $data['error']);
        self::assertSame('Le titre est obligatoire.', $data['details']['title']);
        self::assertSame('La description est obligatoire.', $data['details']['description']);
        self::assertSame('L\'état est obligatoire.', $data['details']['condition']);
    }

    public function testCreateItemWithUnknownCategoryReturnsNotFound(): void
    {
        $client = static::createClient();
        $email = $this->registerUser($client);
        $token = $this->login($client, $email);

        $client->request(
            'POST',
            '/api/items',
            server: [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer '.$token,
            ],
            content: json_encode($this->validPayload(999999), JSON_THROW_ON_ERROR),
        );

        self::assertResponseStatusCodeSame(Response::HTTP_NOT_FOUND);

        $data = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        self::assertSame('La catégorie demandée est introuvable.', $data['error']);
    }

    public function testCreatedItemBelongsToConnectedUser(): void
    {
        $client = static::createClient();
        $email = $this->registerUser($client);
        $token = $this->login($client, $email);
        $category = $this->createCategory('Jardin');

        $client->request(
            'POST',
            '/api/items',
            server: [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer '.$token,
            ],
            content: json_encode($this->validPayload($category->getId()), JSON_THROW_ON_ERROR),
        );

        self::assertResponseStatusCodeSame(Response::HTTP_CREATED);

        $data = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        $item = self::getContainer()->get(ItemRepository::class)->find($data['id']);

        self::assertInstanceOf(Item::class, $item);
        self::assertSame($email, $item->getOwner()?->getEmail());
        self::assertSame($category->getId(), $item->getCategory()?->getId());
    }

    public function testListItemsIsPublic(): void
    {
        $client = static::createClient();

        $client->request('GET', '/api/items');

        self::assertResponseStatusCodeSame(Response::HTTP_OK);
    }

    public function testCreatedItemAppearsInPublicList(): void
    {
        $client = static::createClient();
        $email = $this->registerUser($client);
        $token = $this->login($client, $email);
        $category = $this->createCategory('Cuisine');

        $client->request(
            'POST',
            '/api/items',
            server: [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer '.$token,
            ],
            content: json_encode($this->validPayload($category->getId()), JSON_THROW_ON_ERROR),
        );

        self::assertResponseStatusCodeSame(Response::HTTP_CREATED);

        $createdItem = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        $client->request('GET', '/api/items');

        self::assertResponseStatusCodeSame(Response::HTTP_OK);

        $items = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        $matchingItems = array_values(array_filter(
            $items,
            fn (array $item): bool => $item['id'] === $createdItem['id'],
        ));

        self::assertCount(1, $matchingItems);

        $item = $matchingItems[0];

        self::assertSame('Perceuse Bosch', $item['title']);
        self::assertSame('Paris', $item['city']);
        self::assertSame('Bon état', $item['condition']);
        self::assertSame($category->getId(), $item['category']['id']);
        self::assertSame($email, $item['owner']['email']);
    }

    public function testUnavailableItemDoesNotAppearInPublicList(): void
    {
        $client = static::createClient();
        $email = $this->registerUser($client);
        $token = $this->login($client, $email);
        $category = $this->createCategory('Sport');

        $client->request(
            'POST',
            '/api/items',
            server: [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer '.$token,
            ],
            content: json_encode($this->validPayload($category->getId()), JSON_THROW_ON_ERROR),
        );

        self::assertResponseStatusCodeSame(Response::HTTP_CREATED);

        $createdItem = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        $itemRepository = self::getContainer()->get(ItemRepository::class);
        $item = $itemRepository->find($createdItem['id']);

        self::assertInstanceOf(Item::class, $item);

        $item->setStatus('unavailable');
        self::getContainer()->get(EntityManagerInterface::class)->flush();

        $client->request('GET', '/api/items');

        self::assertResponseStatusCodeSame(Response::HTTP_OK);

        $items = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        $matchingItems = array_values(array_filter(
            $items,
            fn (array $listedItem): bool => $listedItem['id'] === $createdItem['id'],
        ));

        self::assertCount(0, $matchingItems);
    }

    public function testItemDetailReturnsAvailableItem(): void
    {
        $client = static::createClient();
        $email = $this->registerUser($client);
        $token = $this->login($client, $email);
        $category = $this->createCategory('Transport');

        $client->request(
            'POST',
            '/api/items',
            server: [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer '.$token,
            ],
            content: json_encode($this->validPayload($category->getId()), JSON_THROW_ON_ERROR),
        );

        self::assertResponseStatusCodeSame(Response::HTTP_CREATED);

        $createdItem = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        $client->request('GET', sprintf('/api/items/%d', $createdItem['id']));

        self::assertResponseStatusCodeSame(Response::HTTP_OK);

        $item = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        self::assertSame($createdItem['id'], $item['id']);
        self::assertSame('Perceuse Bosch', $item['title']);
        self::assertSame('Perceuse en bon état disponible pour un prêt local.', $item['description']);
        self::assertSame('Paris', $item['city']);
        self::assertSame('Bon état', $item['condition']);
        self::assertSame('https://example.com/image.jpg', $item['imageUrl']);
        self::assertSame($category->getId(), $item['category']['id']);
        self::assertSame($email, $item['owner']['email']);
    }

    public function testItemDetailWithUnknownIdReturnsNotFound(): void
    {
        $client = static::createClient();

        $client->request('GET', '/api/items/999999');

        self::assertResponseStatusCodeSame(Response::HTTP_NOT_FOUND);

        $data = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        self::assertSame("L'objet demandé est introuvable.", $data['error']);
    }

    public function testItemDetailWithUnavailableItemReturnsNotFound(): void
    {
        $client = static::createClient();
        $email = $this->registerUser($client);
        $token = $this->login($client, $email);
        $category = $this->createCategory('Loisirs');

        $client->request(
            'POST',
            '/api/items',
            server: [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer '.$token,
            ],
            content: json_encode($this->validPayload($category->getId()), JSON_THROW_ON_ERROR),
        );

        self::assertResponseStatusCodeSame(Response::HTTP_CREATED);

        $createdItem = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        $item = self::getContainer()->get(ItemRepository::class)->find($createdItem['id']);

        self::assertInstanceOf(Item::class, $item);

        $item->setStatus('unavailable');
        self::getContainer()->get(EntityManagerInterface::class)->flush();

        $client->request('GET', sprintf('/api/items/%d', $createdItem['id']));

        self::assertResponseStatusCodeSame(Response::HTTP_NOT_FOUND);

        $data = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        self::assertSame("L'objet demandé est introuvable.", $data['error']);
    }

    private function registerUser(KernelBrowser $client): string
    {
        $email = sprintf('item-%s@example.com', bin2hex(random_bytes(8)));

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

    private function createCategory(string $name): Category
    {
        $entityManager = self::getContainer()->get(EntityManagerInterface::class);
        $slug = sprintf('%s-%s', strtolower($name), bin2hex(random_bytes(4)));

        $category = new Category();
        $category->setName($name);
        $category->setSlug($slug);

        $entityManager->persist($category);
        $entityManager->flush();

        return $category;
    }

    /** @return array<string, mixed> */
    private function validPayload(?int $categoryId): array
    {
        return [
            'title' => 'Perceuse Bosch',
            'description' => 'Perceuse en bon état disponible pour un prêt local.',
            'city' => 'Paris',
            'condition' => 'Bon état',
            'categoryId' => $categoryId,
            'imageUrl' => 'https://example.com/image.jpg',
        ];
    }
}
