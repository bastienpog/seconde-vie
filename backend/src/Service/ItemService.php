<?php

namespace App\Service;

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
        $category = $this->categoryRepository->find($data['categoryId'] ?? null);

        if ($category === null) {
            throw new NotFoundHttpException('La catégorie demandée est introuvable.');
        }

        $imageUrl = trim((string) ($data['imageUrl'] ?? ''));

        $item = new Item();
        $item->setTitle(trim((string) ($data['title'] ?? '')));
        $item->setDescription(trim((string) ($data['description'] ?? '')));
        $item->setCity(trim((string) ($data['city'] ?? '')));
        $item->setImageUrl($imageUrl === '' ? null : $imageUrl);
        $item->setOwner($owner);
        $item->setCategory($category);

        $this->entityManager->persist($item);
        $this->entityManager->flush();

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
}
