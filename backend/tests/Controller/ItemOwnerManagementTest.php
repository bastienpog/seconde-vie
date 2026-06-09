<?php

namespace App\Tests\Controller;

use App\Entity\Category;
use App\Entity\Item;
use App\Entity\User;
use App\Repository\ItemRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\HttpFoundation\Response;

class ItemOwnerManagementTest extends WebTestCase
{
    public function testListMineRequiresAuthentication(): void
    {
        $client = static::createClient();

        $client->request('GET', '/api/me/items');

        self::assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }

    public function testListMineReturnsOnlyConnectedUserItems(): void
    {
        $client = static::createClient();
        $owner = $this->createUser($client);
        $otherOwner = $this->createUser($client);
        $category = $this->createCategory('Bricolage');
        $ownItem = $this->createItem($owner['user'], $category, 'Ponceuse vibrante');
        $otherItem = $this->createItem($otherOwner['user'], $category, 'Perceuse sans fil');

        $client->request('GET', '/api/me/items', server: ['HTTP_AUTHORIZATION' => 'Bearer '.$owner['token']]);

        self::assertResponseStatusCodeSame(Response::HTTP_OK);
        $items = $this->decodeResponse($client);

        self::assertContains($ownItem->getId(), array_column($items, 'id'));
        self::assertNotContains($otherItem->getId(), array_column($items, 'id'));
    }

    public function testOwnerCanUpdateOwnItem(): void
    {
        $client = static::createClient();
        $owner = $this->createUser($client);
        $category = $this->createCategory('Maison');
        $newCategory = $this->createCategory('Jardin');
        $item = $this->createItem($owner['user'], $category, 'Ancien titre');

        $client->request(
            'PUT',
            sprintf('/api/items/%d', $item->getId()),
            server: [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer '.$owner['token'],
            ],
            content: json_encode($this->payload($newCategory->getId()), JSON_THROW_ON_ERROR),
        );

        self::assertResponseStatusCodeSame(Response::HTTP_OK);
        $data = $this->decodeResponse($client);

        self::assertSame('Perceuse mise a jour', $data['title']);
        self::assertSame('Lyon', $data['city']);
        self::assertSame($newCategory->getId(), $data['category']['id']);
    }

    public function testOtherUserCannotUpdateItem(): void
    {
        $client = static::createClient();
        $owner = $this->createUser($client);
        $otherUser = $this->createUser($client);
        $category = $this->createCategory('Transport');
        $item = $this->createItem($owner['user'], $category, 'Remorque velo');

        $client->request(
            'PUT',
            sprintf('/api/items/%d', $item->getId()),
            server: [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer '.$otherUser['token'],
            ],
            content: json_encode($this->payload($category->getId()), JSON_THROW_ON_ERROR),
        );

        self::assertResponseStatusCodeSame(Response::HTTP_FORBIDDEN);
    }

    public function testUpdateWithInvalidDataReturnsBadRequest(): void
    {
        $client = static::createClient();
        $owner = $this->createUser($client);
        $category = $this->createCategory('Cuisine');
        $item = $this->createItem($owner['user'], $category, 'Robot patissier');
        $payload = $this->payload($category->getId());
        $payload['title'] = '';

        $client->request(
            'PUT',
            sprintf('/api/items/%d', $item->getId()),
            server: [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer '.$owner['token'],
            ],
            content: json_encode($payload, JSON_THROW_ON_ERROR),
        );

        self::assertResponseStatusCodeSame(Response::HTTP_BAD_REQUEST);
    }

    public function testOwnerCanDeleteOwnItem(): void
    {
        $client = static::createClient();
        $owner = $this->createUser($client);
        $category = $this->createCategory('Loisirs');
        $item = $this->createItem($owner['user'], $category, 'Jeu de palets');

        $client->request(
            'DELETE',
            sprintf('/api/items/%d', $item->getId()),
            server: ['HTTP_AUTHORIZATION' => 'Bearer '.$owner['token']],
        );

        self::assertResponseStatusCodeSame(Response::HTTP_NO_CONTENT);
        self::assertNull(self::getContainer()->get(ItemRepository::class)->find($item->getId()));
    }

    public function testOtherUserCannotDeleteItem(): void
    {
        $client = static::createClient();
        $owner = $this->createUser($client);
        $otherUser = $this->createUser($client);
        $category = $this->createCategory('Sport');
        $item = $this->createItem($owner['user'], $category, 'Raquettes tennis');

        $client->request(
            'DELETE',
            sprintf('/api/items/%d', $item->getId()),
            server: ['HTTP_AUTHORIZATION' => 'Bearer '.$otherUser['token']],
        );

        self::assertResponseStatusCodeSame(Response::HTTP_FORBIDDEN);
        self::assertInstanceOf(Item::class, self::getContainer()->get(ItemRepository::class)->find($item->getId()));
    }

    public function testAdminCanDeleteAnyItem(): void
    {
        $client = static::createClient();
        $owner = $this->createUser($client);
        $admin = $this->createUser($client, ['ROLE_ADMIN']);
        $category = $this->createCategory('Admin');
        $item = $this->createItem($owner['user'], $category, 'Annonce moderee');

        $client->request(
            'DELETE',
            sprintf('/api/items/%d', $item->getId()),
            server: ['HTTP_AUTHORIZATION' => 'Bearer '.$admin['token']],
        );

        self::assertResponseStatusCodeSame(Response::HTTP_NO_CONTENT);
        self::assertNull(self::getContainer()->get(ItemRepository::class)->find($item->getId()));
    }

    /**
     * @param list<string> $roles
     * @return array{user: User, token: string, email: string}
     */
    private function createUser(KernelBrowser $client, array $roles = ['ROLE_USER']): array
    {
        $email = sprintf('owner-%s@example.com', bin2hex(random_bytes(8)));

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

        $user = self::getContainer()->get(UserRepository::class)->findOneBy(['email' => $email]);
        self::assertInstanceOf(User::class, $user);
        $user->setRoles($roles);
        self::getContainer()->get(EntityManagerInterface::class)->flush();

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

    private function createCategory(string $name): Category
    {
        $entityManager = self::getContainer()->get(EntityManagerInterface::class);
        $category = new Category();
        $category->setName($name);
        $category->setSlug(sprintf('%s-%s', strtolower($name), bin2hex(random_bytes(4))));

        $entityManager->persist($category);
        $entityManager->flush();

        return $category;
    }

    private function createItem(User $owner, Category $category, string $title): Item
    {
        $entityManager = self::getContainer()->get(EntityManagerInterface::class);
        $managedOwner = $entityManager->find(User::class, $owner->getId());
        $managedCategory = $entityManager->find(Category::class, $category->getId());

        self::assertInstanceOf(User::class, $managedOwner);
        self::assertInstanceOf(Category::class, $managedCategory);

        $item = new Item();
        $item->setOwner($managedOwner);
        $item->setCategory($managedCategory);
        $item->setTitle($title);
        $item->setDescription('Description assez longue pour etre valide.');
        $item->setCity('Paris');
        $item->setCondition('Bon etat');

        $entityManager->persist($item);
        $entityManager->flush();

        return $item;
    }

    /** @return array<string, mixed> */
    private function payload(?int $categoryId): array
    {
        return [
            'title' => 'Perceuse mise a jour',
            'description' => 'Description mise a jour pour un pret local.',
            'city' => 'Lyon',
            'condition' => 'Tres bon etat',
            'categoryId' => $categoryId,
            'imageUrl' => 'https://example.com/updated.jpg',
        ];
    }

    /** @return array<string, mixed> */
    private function decodeResponse(KernelBrowser $client): array
    {
        return json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
    }
}
