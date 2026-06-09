<?php

namespace App\Tests\Controller;

use App\Entity\Category;
use App\Entity\Item;
use App\Entity\LoanRequest;
use App\Entity\User;
use App\Repository\ItemRepository;
use App\Repository\LoanRequestRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\HttpFoundation\Response;

class AccountDeletionTest extends WebTestCase
{
    public function testDeleteMeRequiresAuthentication(): void
    {
        $client = static::createClient();

        $client->request('DELETE', '/api/me');

        self::assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }

    public function testDeleteMeDeletesUserOwnedItemsAndRelatedLoanRequests(): void
    {
        $client = static::createClient();
        $userToDelete = $this->createUser($client);
        $borrower = $this->createUser($client);
        $owner = $this->createUser($client);
        $category = $this->createCategory('Compte '.bin2hex(random_bytes(4)));
        $ownedItem = $this->createItem($userToDelete['user'], $category, 'Perceuse compte');
        $otherItem = $this->createItem($owner['user'], $category, 'Scie circulaire');
        $receivedLoanRequest = $this->createLoanRequest($ownedItem, $borrower['user']);
        $sentLoanRequest = $this->createLoanRequest($otherItem, $userToDelete['user']);

        $client->request('DELETE', '/api/me', server: ['HTTP_AUTHORIZATION' => 'Bearer '.$userToDelete['token']]);

        self::assertResponseStatusCodeSame(Response::HTTP_NO_CONTENT);

        self::getContainer()->get(EntityManagerInterface::class)->clear();

        self::assertNull(self::getContainer()->get(UserRepository::class)->find($userToDelete['user']->getId()));
        self::assertNull(self::getContainer()->get(ItemRepository::class)->find($ownedItem->getId()));
        self::assertNull(self::getContainer()->get(LoanRequestRepository::class)->find($receivedLoanRequest->getId()));
        self::assertNull(self::getContainer()->get(LoanRequestRepository::class)->find($sentLoanRequest->getId()));
        self::assertInstanceOf(Item::class, self::getContainer()->get(ItemRepository::class)->find($otherItem->getId()));
    }

    /** @return array{user: User, token: string, email: string} */
    private function createUser(KernelBrowser $client): array
    {
        $email = sprintf('account-%s@example.com', bin2hex(random_bytes(8)));

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
        $data = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

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
        $item->setDescription('Description assez longue pour un pret local.');
        $item->setCity('Paris');
        $item->setCondition('Bon etat');

        $entityManager->persist($item);
        $entityManager->flush();

        return $item;
    }

    private function createLoanRequest(Item $item, User $borrower): LoanRequest
    {
        $entityManager = self::getContainer()->get(EntityManagerInterface::class);
        $managedItem = $entityManager->find(Item::class, $item->getId());
        $managedBorrower = $entityManager->find(User::class, $borrower->getId());

        self::assertInstanceOf(Item::class, $managedItem);
        self::assertInstanceOf(User::class, $managedBorrower);

        $loanRequest = new LoanRequest();
        $loanRequest->setItem($managedItem);
        $loanRequest->setBorrower($managedBorrower);

        $entityManager->persist($loanRequest);
        $entityManager->flush();

        return $loanRequest;
    }
}
