<?php

namespace App\Service;

use App\Entity\Category;
use App\Entity\Item;
use App\Entity\User;
use App\Repository\CategoryRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class ItemService
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly CategoryRepository $categoryRepository,
    ) {
    }

    /** @param array<string, mixed> $data */
    public function create(array $data, User $owner): Item
    {
        $normalizedData = $this->validate($data);
        $category = $this->categoryRepository->find($normalizedData['categoryId']);

        if ($category === null) {
            throw new NotFoundHttpException('La catégorie demandée est introuvable.');
        }

        $item = $this->buildItem($normalizedData, $owner, $category);

        $this->entityManager->persist($item);
        $this->entityManager->flush();

        return $item;
    }


    /**
     * @param array{title: string, description: string, city: string, imageUrl: ?string, categoryId: int} $data
     */
    private function buildItem(array $data, User $owner, Category $category): Item
    {
        $item = new Item();
        $item->setTitle($data['title']);
        $item->setDescription($data['description']);
        $item->setCity($data['city']);
        $item->setImageUrl($data['imageUrl']);
        $item->setOwner($owner);
        $item->setCategory($category);

        return $item;
    }

    /** @return array<string, mixed> */
    public function formatItem(Item $item): array
    {
        $category = $item->getCategory();
        $owner = $item->getOwner();

        return [
            'id' => $item->getId(),
            'title' => $item->getTitle(),
            'description' => $item->getDescription(),
            'city' => $item->getCity(),
            'imageUrl' => $item->getImageUrl(),
            'status' => $item->getStatus(),
            'category' => $category === null ? null : [
                'id' => $category->getId(),
                'name' => $category->getName(),
            ],
            'owner' => $owner === null ? null : [
                'id' => $owner->getId(),
                'email' => $owner->getEmail(),
            ],
            'createdAt' => $item->getCreatedAt()->format(\DateTimeInterface::ATOM),
        ];
    }

    /**
     * @param array<string, mixed> $data
     * @return array{title: string, description: string, city: string, imageUrl: ?string, categoryId: int}
     */
    private function validate(array $data): array
    {
        $title = trim((string) ($data['title'] ?? ''));
        $description = trim((string) ($data['description'] ?? ''));
        $city = trim((string) ($data['city'] ?? ''));
        $imageUrl = trim((string) ($data['imageUrl'] ?? ''));
        $categoryId = $data['categoryId'] ?? null;
        $details = [];

        if ($title === '') {
            $details['title'] = 'Le titre est obligatoire.';
        } elseif (mb_strlen($title) < 3) {
            $details['title'] = 'Le titre doit contenir au moins 3 caractères.';
        }

        if ($description === '') {
            $details['description'] = 'La description est obligatoire.';
        } elseif (mb_strlen($description) < 10) {
            $details['description'] = 'La description doit contenir au moins 10 caractères.';
        }

        if ($city === '') {
            $details['city'] = 'La ville est obligatoire.';
        }

        if ($categoryId === null || $categoryId === '') {
            $details['categoryId'] = 'La catégorie est obligatoire.';
        } elseif (filter_var($categoryId, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]) === false) {
            $details['categoryId'] = 'La catégorie doit être un identifiant valide.';
        }

        if ($imageUrl !== '' && filter_var($imageUrl, FILTER_VALIDATE_URL) === false) {
            $details['imageUrl'] = "L'URL de l'image n'est pas valide.";
        }

        if ($details !== []) {
            throw new ItemValidationException($details);
        }

        return [
            'title' => $title,
            'description' => $description,
            'city' => $city,
            'imageUrl' => $imageUrl === '' ? null : $imageUrl,
            'categoryId' => (int) $categoryId,
        ];
    }
}
