<?php

namespace App\Tests\Controller;

use App\Entity\Category;
use App\Entity\Item;
use App\Entity\LoanRequest;
use App\Entity\User;
use App\Repository\LoanRequestRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\HttpFoundation\Response;

class LoanRequestTest extends WebTestCase
{
    public function testCreateLoanRequestWithTokenReturnsCreated(): void
    {
        $client = static::createClient();
        $owner = $this->createUser($client);
        $borrower = $this->createUser($client);
        $item = $this->createItem($owner['user'], $this->createCategory('Bricolage'), 'Perceuse disponible');

        $client->request(
            'POST',
            sprintf('/api/items/%d/loan-requests', $item->getId()),
            server: [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer '.$borrower['token'],
            ],
            content: json_encode($this->payload(), JSON_THROW_ON_ERROR),
        );

        self::assertResponseStatusCodeSame(Response::HTTP_CREATED);
        $data = $this->decodeResponse($client);

        self::assertSame(LoanRequest::STATUS_PENDING, $data['status']);
        self::assertSame('2026-06-15', $data['startDate']);
        self::assertSame('2026-06-17', $data['endDate']);
        self::assertSame($item->getId(), $data['item']['id']);
        self::assertSame($borrower['email'], $data['borrower']['email']);
    }

    public function testCreateLoanRequestWithoutTokenReturnsUnauthorized(): void
    {
        $client = static::createClient();
        $owner = $this->createUser($client);
        $item = $this->createItem($owner['user'], $this->createCategory('Maison'), 'Escabeau stable');

        $client->request('POST', sprintf('/api/items/%d/loan-requests', $item->getId()));

        self::assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }

    public function testOwnerCannotRequestOwnItem(): void
    {
        $client = static::createClient();
        $owner = $this->createUser($client);
        $item = $this->createItem($owner['user'], $this->createCategory('Jardin'), 'Tondeuse electrique');

        $client->request(
            'POST',
            sprintf('/api/items/%d/loan-requests', $item->getId()),
            server: [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer '.$owner['token'],
            ],
            content: json_encode($this->payload(), JSON_THROW_ON_ERROR),
        );

        self::assertResponseStatusCodeSame(Response::HTTP_CONFLICT);
    }

    public function testCreateLoanRequestWithoutDatesReturnsBadRequest(): void
    {
        $client = static::createClient();
        $owner = $this->createUser($client);
        $borrower = $this->createUser($client);
        $item = $this->createItem($owner['user'], $this->createCategory('Bricolage'), 'Scie sauteuse');

        $client->request(
            'POST',
            sprintf('/api/items/%d/loan-requests', $item->getId()),
            server: [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer '.$borrower['token'],
            ],
            content: json_encode([], JSON_THROW_ON_ERROR),
        );

        self::assertResponseStatusCodeSame(Response::HTTP_BAD_REQUEST);
    }

    public function testCreateLoanRequestWithInvalidDateFormatReturnsBadRequest(): void
    {
        $client = static::createClient();
        $owner = $this->createUser($client);
        $borrower = $this->createUser($client);
        $item = $this->createItem($owner['user'], $this->createCategory('Bricolage'), 'Niveau laser');
        $payload = $this->payload();
        $payload['startDate'] = '15/06/2026';

        $client->request(
            'POST',
            sprintf('/api/items/%d/loan-requests', $item->getId()),
            server: [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer '.$borrower['token'],
            ],
            content: json_encode($payload, JSON_THROW_ON_ERROR),
        );

        self::assertResponseStatusCodeSame(Response::HTTP_BAD_REQUEST);
    }

    public function testCreateLoanRequestWithEndDateBeforeStartDateReturnsBadRequest(): void
    {
        $client = static::createClient();
        $owner = $this->createUser($client);
        $borrower = $this->createUser($client);
        $item = $this->createItem($owner['user'], $this->createCategory('Bricolage'), 'Ponceuse');

        $client->request(
            'POST',
            sprintf('/api/items/%d/loan-requests', $item->getId()),
            server: [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer '.$borrower['token'],
            ],
            content: json_encode([
                'startDate' => '2026-06-17',
                'endDate' => '2026-06-15',
            ], JSON_THROW_ON_ERROR),
        );

        self::assertResponseStatusCodeSame(Response::HTTP_BAD_REQUEST);
    }

    public function testSentRequestsAreFilteredByBorrower(): void
    {
        $client = static::createClient();
        $owner = $this->createUser($client);
        $borrower = $this->createUser($client);
        $otherBorrower = $this->createUser($client);
        $category = $this->createCategory('Transport');
        $loanRequest = $this->createLoanRequest($this->createItem($owner['user'], $category, 'Remorque velo'), $borrower['user']);
        $otherLoanRequest = $this->createLoanRequest($this->createItem($owner['user'], $category, 'Pompe velo'), $otherBorrower['user']);

        $client->request('GET', '/api/me/loan-requests/sent', server: ['HTTP_AUTHORIZATION' => 'Bearer '.$borrower['token']]);

        self::assertResponseStatusCodeSame(Response::HTTP_OK);
        $requests = $this->decodeResponse($client);

        self::assertContains($loanRequest->getId(), array_column($requests, 'id'));
        self::assertNotContains($otherLoanRequest->getId(), array_column($requests, 'id'));
    }

    public function testReceivedRequestsAreFilteredByOwner(): void
    {
        $client = static::createClient();
        $owner = $this->createUser($client);
        $otherOwner = $this->createUser($client);
        $borrower = $this->createUser($client);
        $category = $this->createCategory('Loisirs');
        $loanRequest = $this->createLoanRequest($this->createItem($owner['user'], $category, 'Projecteur video'), $borrower['user']);
        $otherLoanRequest = $this->createLoanRequest($this->createItem($otherOwner['user'], $category, 'Ecran projection'), $borrower['user']);

        $client->request('GET', '/api/me/loan-requests/received', server: ['HTTP_AUTHORIZATION' => 'Bearer '.$owner['token']]);

        self::assertResponseStatusCodeSame(Response::HTTP_OK);
        $requests = $this->decodeResponse($client);

        self::assertContains($loanRequest->getId(), array_column($requests, 'id'));
        self::assertNotContains($otherLoanRequest->getId(), array_column($requests, 'id'));
    }

    public function testOwnerCanAcceptLoanRequest(): void
    {
        $client = static::createClient();
        $owner = $this->createUser($client);
        $borrower = $this->createUser($client);
        $loanRequest = $this->createLoanRequest($this->createItem($owner['user'], $this->createCategory('Cuisine'), 'Appareil raclette'), $borrower['user']);

        $client->request(
            'PUT',
            sprintf('/api/loan-requests/%d/accept', $loanRequest->getId()),
            server: ['HTTP_AUTHORIZATION' => 'Bearer '.$owner['token']],
        );

        self::assertResponseStatusCodeSame(Response::HTTP_OK);
        $data = $this->decodeResponse($client);

        self::assertSame(LoanRequest::STATUS_ACCEPTED, $data['status']);
    }

    public function testOwnerCanRefuseLoanRequest(): void
    {
        $client = static::createClient();
        $owner = $this->createUser($client);
        $borrower = $this->createUser($client);
        $loanRequest = $this->createLoanRequest($this->createItem($owner['user'], $this->createCategory('Sport'), 'Ballon basket'), $borrower['user']);

        $client->request(
            'PUT',
            sprintf('/api/loan-requests/%d/refuse', $loanRequest->getId()),
            server: ['HTTP_AUTHORIZATION' => 'Bearer '.$owner['token']],
        );

        self::assertResponseStatusCodeSame(Response::HTTP_OK);
        $data = $this->decodeResponse($client);

        self::assertSame(LoanRequest::STATUS_REFUSED, $data['status']);
    }

    public function testOtherUserCannotAnswerLoanRequest(): void
    {
        $client = static::createClient();
        $owner = $this->createUser($client);
        $borrower = $this->createUser($client);
        $otherUser = $this->createUser($client);
        $loanRequest = $this->createLoanRequest($this->createItem($owner['user'], $this->createCategory('Outillage'), 'Marteau piqueur'), $borrower['user']);

        $client->request(
            'PUT',
            sprintf('/api/loan-requests/%d/accept', $loanRequest->getId()),
            server: ['HTTP_AUTHORIZATION' => 'Bearer '.$otherUser['token']],
        );

        self::assertResponseStatusCodeSame(Response::HTTP_FORBIDDEN);
    }

    /** @return array{user: User, token: string, email: string} */
    private function createUser(KernelBrowser $client): array
    {
        $email = sprintf('loan-%s@example.com', bin2hex(random_bytes(8)));

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

        $storedLoanRequest = self::getContainer()->get(LoanRequestRepository::class)->find($loanRequest->getId());
        self::assertInstanceOf(LoanRequest::class, $storedLoanRequest);

        return $storedLoanRequest;
    }

    /** @return array{startDate: string, endDate: string} */
    private function payload(): array
    {
        return [
            'startDate' => '2026-06-15',
            'endDate' => '2026-06-17',
        ];
    }

    /** @return array<string, mixed> */
    private function decodeResponse(KernelBrowser $client): array
    {
        return json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
    }
}
