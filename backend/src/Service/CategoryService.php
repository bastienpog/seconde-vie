<?php

namespace App\Service;

use App\Entity\Category;
use App\Repository\CategoryRepository;
use App\Repository\ItemRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\String\Slugger\AsciiSlugger;

class CategoryService
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly CategoryRepository $categoryRepository,
        private readonly ItemRepository $itemRepository,
    ) {
    }

    /** @param array<string, mixed> $data */
    public function create(array $data): Category
    {
        $name = $this->validateName($data);

        $category = new Category();
        $category->setName($name);
        $category->setSlug($this->slugify($name));

        $this->entityManager->persist($category);
        $this->entityManager->flush();

        return $category;
    }

    /** @param array<string, mixed> $data */
    public function update(int $id, array $data): Category
    {
        $category = $this->findCategory($id);
        $name = $this->validateName($data);

        $category->setName($name);
        $category->setSlug($this->slugify($name));

        $this->entityManager->flush();

        return $category;
    }

    public function delete(int $id): void
    {
        $category = $this->findCategory($id);

        if ($this->itemRepository->count(['category' => $category]) > 0) {
            throw new ConflictHttpException('La catégorie est utilisée par une annonce.');
        }

        $this->entityManager->remove($category);
        $this->entityManager->flush();
    }

    /** @return array{id: int|null, name: string|null, slug: string|null} */
    public function formatCategory(Category $category): array
    {
        return [
            'id' => $category->getId(),
            'name' => $category->getName(),
            'slug' => $category->getSlug(),
        ];
    }

    /** @param array<string, mixed> $data */
    private function validateName(array $data): string
    {
        $name = trim((string) ($data['name'] ?? ''));

        if ($name === '') {
            throw new BadRequestHttpException('Le nom de la catégorie est obligatoire.');
        }

        return $name;
    }

    private function findCategory(int $id): Category
    {
        $category = $this->categoryRepository->find($id);

        if (!$category instanceof Category) {
            throw new NotFoundHttpException('La catégorie demandée est introuvable.');
        }

        return $category;
    }

    private function slugify(string $name): string
    {
        return (new AsciiSlugger('fr'))->slug($name)->lower()->toString();
    }
}
