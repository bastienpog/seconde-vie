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

class AdminItemTest extends WebTestCase
{
    public function testListAdminItemsRequiresAuthentication(): void
    {
        $client = static::createClient();

        $client->request('GET', '/api/admin/items');

        self::assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }

    public function testListAdminItemsRequiresAdminRole(): void
    {
        $client = static::createClient();
        $user = $this->createUser($client);

        $client->request(
            'GET',
            '/api/admin/items',
            server: ['HTTP_AUTHORIZATION' => 'Bearer '.$user['token']],
        );

        self::assertResponseStatusCodeSame(Response::HTTP_FORBIDDEN);
    }

    public function testAdminCanListAllItemsIncludingUnavailableOnes(): void
    {
        $client = static::createClient();
        $admin = $this->createUser($client, ['ROLE_ADMIN']);
        $owner = $this->createUser($client);
        $category = $this->createCategory('Admin items '.bin2hex(random_bytes(4)));
        $availableItem = $this->createItem($owner['user'], $category, 'Perceuse disponible', Item::STATUS_AVAILABLE);
        $unavailableItem = $this->createItem($owner['user'], $category, 'Tondeuse indisponible', 'unavailable');

        $client->request(
            'GET',
            '/api/admin/items',
            server: ['HTTP_AUTHORIZATION' => 'Bearer '.$admin['token']],
        );

        self::assertResponseIsSuccessful();
        $data = $this->decodeResponse($client);
        $ids = array_column($data, 'id');

        self::assertContains($availableItem->getId(), $ids);
        self::assertContains($unavailableItem->getId(), $ids);
    }

    public function testAdminCanDeleteAnyItem(): void
    {
        $client = static::createClient();
        $admin = $this->createUser($client, ['ROLE_ADMIN']);
        $owner = $this->createUser($client);
        $category = $this->createCategory('Admin item delete '.bin2hex(random_bytes(4)));
        $item = $this->createItem($owner['user'], $category, 'Objet a supprimer', Item::STATUS_AVAILABLE);

        $client->request(
            'DELETE',
            sprintf('/api/admin/items/%d', $item->getId()),
            server: ['HTTP_AUTHORIZATION' => 'Bearer '.$admin['token']],
        );

        self::assertResponseStatusCodeSame(Response::HTTP_NO_CONTENT);
        self::assertNull(self::getContainer()->get(ItemRepository::class)->find($item->getId()));
    }

    public function testDeleteUnknownAdminItemReturnsNotFound(): void
    {
        $client = static::createClient();
        $admin = $this->createUser($client, ['ROLE_ADMIN']);

        $client->request(
            'DELETE',
            '/api/admin/items/999999',
            server: ['HTTP_AUTHORIZATION' => 'Bearer '.$admin['token']],
        );

        self::assertResponseStatusCodeSame(Response::HTTP_NOT_FOUND);
    }

    /**
     * @param list<string> $roles
     * @return array{user: User, token: string, email: string}
     */
    private function createUser(KernelBrowser $client, array $roles = ['ROLE_USER']): array
    {
        $email = sprintf('admin-item-%s@example.com', bin2hex(random_bytes(8)));

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

    private function createCategory(string $name): Category
    {
        $entityManager = self::getContainer()->get(EntityManagerInterface::class);
        $category = new Category();
        $category->setName($name);
        $category->setSlug(strtolower(str_replace(' ', '-', $name)));

        $entityManager->persist($category);
        $entityManager->flush();

        return $category;
    }

    private function createItem(User $owner, Category $category, string $title, string $status): Item
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
        $item->setDescription('Description assez longue pour un pret local.');
        $item->setCity('Paris');
        $item->setCondition('Bon etat');
        $item->setStatus($status);

        $entityManager->persist($item);
        $entityManager->flush();

        return $item;
    }

    /** @return array<string, mixed> */
    private function decodeResponse(KernelBrowser $client): array
    {
        return json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
    }
}
