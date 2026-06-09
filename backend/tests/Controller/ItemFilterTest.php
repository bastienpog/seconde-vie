<?php

namespace App\Tests\Controller;

use App\Entity\Category;
use App\Entity\Item;
use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\HttpFoundation\Response;

class ItemFilterTest extends WebTestCase
{
    public function testSearchFindsItemByTitle(): void
    {
        $client = static::createClient();
        $context = $this->createContext($client);
        $matchingItem = $this->createItem($context['owner'], $context['category'], 'Escabeau aluminium', 'Pratique pour les travaux dans la maison.', 'Lyon');
        $this->createItem($context['owner'], $context['category'], 'Tondeuse manuelle', 'Disponible pour un jardin de quartier.', 'Lyon');

        $client->request('GET', '/api/items?search=escabeau');

        self::assertResponseStatusCodeSame(Response::HTTP_OK);
        $items = $this->decodeResponse($client);

        self::assertContainsItem($matchingItem->getId(), $items);
        self::assertCount(1, $items);
    }

    public function testSearchFindsItemByDescription(): void
    {
        $client = static::createClient();
        $context = $this->createContext($client);
        $matchingItem = $this->createItem($context['owner'], $context['category'], 'Kit bricolage', 'Contient une ponceuse orbitale en bon etat.', 'Nantes');
        $this->createItem($context['owner'], $context['category'], 'Appareil raclette', 'Pour repas familial ponctuel.', 'Nantes');

        $client->request('GET', '/api/items?search=orbitale');

        self::assertResponseStatusCodeSame(Response::HTTP_OK);
        $items = $this->decodeResponse($client);

        self::assertContainsItem($matchingItem->getId(), $items);
        self::assertCount(1, $items);
    }

    public function testCityFiltersAvailableItems(): void
    {
        $client = static::createClient();
        $context = $this->createContext($client);
        $matchingItem = $this->createItem($context['owner'], $context['category'], 'Table pliante', 'Table disponible pour un evenement local.', 'Rennes');
        $this->createItem($context['owner'], $context['category'], 'Chaise haute', 'Chaise haute propre et solide.', 'Bordeaux');

        $client->request('GET', '/api/items?city=rennes');

        self::assertResponseStatusCodeSame(Response::HTTP_OK);
        $items = $this->decodeResponse($client);

        self::assertContainsItem($matchingItem->getId(), $items);
        self::assertCount(1, $items);
    }

    public function testCategoryFiltersAvailableItems(): void
    {
        $client = static::createClient();
        $context = $this->createContext($client);
        $otherCategory = $this->createCategory('Cuisine');
        $matchingItem = $this->createItem($context['owner'], $context['category'], 'Perceuse filaire', 'Perceuse disponible pour petits travaux.', 'Paris');
        $this->createItem($context['owner'], $otherCategory, 'Moule a gateau', 'Moule familial disponible ce week-end.', 'Paris');

        $client->request('GET', sprintf('/api/items?category=%d', $context['category']->getId()));

        self::assertResponseStatusCodeSame(Response::HTTP_OK);
        $items = $this->decodeResponse($client);

        self::assertContainsItem($matchingItem->getId(), $items);
        self::assertCount(1, $items);
    }

    public function testFiltersCanBeCombined(): void
    {
        $client = static::createClient();
        $context = $this->createContext($client);
        $otherCategory = $this->createCategory('Jardin');
        $matchingItem = $this->createItem($context['owner'], $context['category'], 'Scie sauteuse', 'Scie compacte pour bricolage simple.', 'Marseille');
        $this->createItem($context['owner'], $context['category'], 'Scie circulaire', 'Scie puissante pour atelier.', 'Lille');
        $this->createItem($context['owner'], $otherCategory, 'Scie a branches', 'Scie utile pour le jardin.', 'Marseille');

        $client->request('GET', sprintf('/api/items?search=scie&category=%d&city=marseille', $context['category']->getId()));

        self::assertResponseStatusCodeSame(Response::HTTP_OK);
        $items = $this->decodeResponse($client);

        self::assertContainsItem($matchingItem->getId(), $items);
        self::assertCount(1, $items);
    }

    public function testSearchWithoutResultReturnsEmptyList(): void
    {
        $client = static::createClient();
        $context = $this->createContext($client);
        $this->createItem($context['owner'], $context['category'], 'Diable pliant', 'Utile pour deplacer des cartons.', 'Tours');

        $client->request('GET', '/api/items?search=aucun-resultat-attendu');

        self::assertResponseStatusCodeSame(Response::HTTP_OK);
        self::assertSame([], $this->decodeResponse($client));
    }

    public function testUnavailableItemsAreExcludedFromFilteredList(): void
    {
        $client = static::createClient();
        $context = $this->createContext($client);
        $this->createItem($context['owner'], $context['category'], 'Nettoyeur vapeur', 'Nettoyeur vapeur disponible sur demande.', 'Dijon', 'unavailable');

        $client->request('GET', '/api/items?search=nettoyeur');

        self::assertResponseStatusCodeSame(Response::HTTP_OK);
        self::assertSame([], $this->decodeResponse($client));
    }

    /** @return array{owner: User, category: Category} */
    private function createContext(KernelBrowser $client): array
    {
        $email = sprintf('filter-%s@example.com', bin2hex(random_bytes(8)));

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

        $owner = self::getContainer()->get(UserRepository::class)->findOneBy(['email' => $email]);
        self::assertInstanceOf(User::class, $owner);

        return [
            'owner' => $owner,
            'category' => $this->createCategory('Bricolage'),
        ];
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

    private function createItem(User $owner, Category $category, string $title, string $description, string $city, string $status = Item::STATUS_AVAILABLE): Item
    {
        $entityManager = self::getContainer()->get(EntityManagerInterface::class);

        $item = new Item();
        $item->setOwner($owner);
        $item->setCategory($category);
        $item->setTitle($title);
        $item->setDescription($description);
        $item->setCity($city);
        $item->setCondition('Bon etat');
        $item->setStatus($status);

        $entityManager->persist($item);
        $entityManager->flush();

        return $item;
    }

    /** @return list<array<string, mixed>> */
    private function decodeResponse(KernelBrowser $client): array
    {
        return json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
    }

    /** @param list<array<string, mixed>> $items */
    private static function assertContainsItem(?int $itemId, array $items): void
    {
        self::assertNotNull($itemId);
        self::assertContains($itemId, array_column($items, 'id'));
    }
}
