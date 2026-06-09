<?php

namespace App\Tests\Controller;

use App\Entity\Category;
use App\Entity\Item;
use App\Entity\User;
use App\Repository\CategoryRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\HttpFoundation\Response;

class AdminCategoryTest extends WebTestCase
{
    public function testCreateCategoryRequiresAuthentication(): void
    {
        $client = static::createClient();

        $client->request(
            'POST',
            '/api/admin/categories',
            server: ['CONTENT_TYPE' => 'application/json'],
            content: json_encode(['name' => 'Outillage'], JSON_THROW_ON_ERROR),
        );

        self::assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }

    public function testCreateCategoryRequiresAdminRole(): void
    {
        $client = static::createClient();
        $user = $this->createUser($client);

        $client->request(
            'POST',
            '/api/admin/categories',
            server: [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer '.$user['token'],
            ],
            content: json_encode(['name' => 'Outillage'], JSON_THROW_ON_ERROR),
        );

        self::assertResponseStatusCodeSame(Response::HTTP_FORBIDDEN);
    }

    public function testAdminCanCreateAndUpdateCategory(): void
    {
        $client = static::createClient();
        $admin = $this->createUser($client, ['ROLE_ADMIN']);
        $name = 'Petit electromenager '.bin2hex(random_bytes(4));
        $updatedName = 'Materiel jardin '.bin2hex(random_bytes(4));

        $client->request(
            'POST',
            '/api/admin/categories',
            server: [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer '.$admin['token'],
            ],
            content: json_encode(['name' => $name], JSON_THROW_ON_ERROR),
        );

        self::assertResponseStatusCodeSame(Response::HTTP_CREATED);
        $created = $this->decodeResponse($client);
        self::assertSame($name, $created['name']);
        self::assertSame(strtolower(str_replace(' ', '-', $name)), $created['slug']);

        $client->request(
            'PUT',
            sprintf('/api/admin/categories/%d', $created['id']),
            server: [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer '.$admin['token'],
            ],
            content: json_encode(['name' => $updatedName], JSON_THROW_ON_ERROR),
        );

        self::assertResponseStatusCodeSame(Response::HTTP_OK);
        $updated = $this->decodeResponse($client);
        self::assertSame($updatedName, $updated['name']);
        self::assertSame(strtolower(str_replace(' ', '-', $updatedName)), $updated['slug']);
    }

    public function testAdminCategoryNameIsRequired(): void
    {
        $client = static::createClient();
        $admin = $this->createUser($client, ['ROLE_ADMIN']);

        $client->request(
            'POST',
            '/api/admin/categories',
            server: [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer '.$admin['token'],
            ],
            content: json_encode(['name' => ''], JSON_THROW_ON_ERROR),
        );

        self::assertResponseStatusCodeSame(Response::HTTP_BAD_REQUEST);
    }

    public function testUpdateUnknownCategoryReturnsNotFound(): void
    {
        $client = static::createClient();
        $admin = $this->createUser($client, ['ROLE_ADMIN']);

        $client->request(
            'PUT',
            '/api/admin/categories/999999',
            server: [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer '.$admin['token'],
            ],
            content: json_encode(['name' => 'Inconnue'], JSON_THROW_ON_ERROR),
        );

        self::assertResponseStatusCodeSame(Response::HTTP_NOT_FOUND);
    }

    public function testAdminCanDeleteUnusedCategory(): void
    {
        $client = static::createClient();
        $admin = $this->createUser($client, ['ROLE_ADMIN']);
        $category = $this->createCategory('Admin delete '.bin2hex(random_bytes(4)));

        $client->request(
            'DELETE',
            sprintf('/api/admin/categories/%d', $category->getId()),
            server: ['HTTP_AUTHORIZATION' => 'Bearer '.$admin['token']],
        );

        self::assertResponseStatusCodeSame(Response::HTTP_NO_CONTENT);
        self::assertNull(self::getContainer()->get(CategoryRepository::class)->find($category->getId()));
    }

    public function testAdminCannotDeleteUsedCategory(): void
    {
        $client = static::createClient();
        $admin = $this->createUser($client, ['ROLE_ADMIN']);
        $owner = $this->createUser($client);
        $category = $this->createCategory('Admin used '.bin2hex(random_bytes(4)));
        $this->createItem($owner['user'], $category);

        $client->request(
            'DELETE',
            sprintf('/api/admin/categories/%d', $category->getId()),
            server: ['HTTP_AUTHORIZATION' => 'Bearer '.$admin['token']],
        );

        self::assertResponseStatusCodeSame(Response::HTTP_CONFLICT);
        self::assertInstanceOf(Category::class, self::getContainer()->get(CategoryRepository::class)->find($category->getId()));
    }

    /**
     * @param list<string> $roles
     * @return array{user: User, token: string, email: string}
     */
    private function createUser(KernelBrowser $client, array $roles = ['ROLE_USER']): array
    {
        $email = sprintf('admin-category-%s@example.com', bin2hex(random_bytes(8)));

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

    private function createItem(User $owner, Category $category): Item
    {
        $entityManager = self::getContainer()->get(EntityManagerInterface::class);
        $managedOwner = $entityManager->find(User::class, $owner->getId());
        $managedCategory = $entityManager->find(Category::class, $category->getId());

        self::assertInstanceOf(User::class, $managedOwner);
        self::assertInstanceOf(Category::class, $managedCategory);

        $item = new Item();
        $item->setOwner($managedOwner);
        $item->setCategory($managedCategory);
        $item->setTitle('Annonce categorie utilisee');
        $item->setDescription('Description assez longue pour un pret local.');
        $item->setCity('Paris');
        $item->setCondition('Bon etat');

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
