<?php

namespace App\Tests\Controller;

use App\Entity\Category;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\HttpFoundation\Response;

class CategoryListTest extends WebTestCase
{
    public function testListCategoriesIsPublic(): void
    {
        $client = static::createClient();
        $category = $this->createCategory('Bricolage');

        $client->request('GET', '/api/categories');

        self::assertResponseStatusCodeSame(Response::HTTP_OK);

        $categories = $this->decodeResponse($client);
        $matchingCategories = array_values(array_filter(
            $categories,
            fn (array $listedCategory): bool => $listedCategory['id'] === $category->getId(),
        ));

        self::assertCount(1, $matchingCategories);
        self::assertSame('Bricolage', $matchingCategories[0]['name']);
        self::assertSame($category->getSlug(), $matchingCategories[0]['slug']);
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

    /** @return list<array<string, mixed>> */
    private function decodeResponse(KernelBrowser $client): array
    {
        return json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
    }
}
