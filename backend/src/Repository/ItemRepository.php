<?php

namespace App\Repository;

use App\Entity\Item;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Item>
 */
class ItemRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Item::class);
    }

    /** @return list<Item> */
    public function findAvailable(?string $search = null, ?int $categoryId = null, ?string $city = null): array
    {
        $queryBuilder = $this->createQueryBuilder('item')
            ->andWhere('item.status = :status')
            ->setParameter('status', Item::STATUS_AVAILABLE)
            ->orderBy('item.createdAt', 'DESC');

        if ($search !== null && $search !== '') {
            $queryBuilder
                ->andWhere('LOWER(item.title) LIKE :search OR LOWER(item.description) LIKE :search')
                ->setParameter('search', '%'.mb_strtolower($search).'%');
        }

        if ($categoryId !== null) {
            $queryBuilder
                ->andWhere('IDENTITY(item.category) = :categoryId')
                ->setParameter('categoryId', $categoryId);
        }

        if ($city !== null && $city !== '') {
            $queryBuilder
                ->andWhere('LOWER(item.city) LIKE :city')
                ->setParameter('city', '%'.mb_strtolower($city).'%');
        }

        return $queryBuilder->getQuery()->getResult();
    }

    public function findAvailableById(int $id): ?Item
    {
        return $this->findOneBy([
            'id' => $id,
            'status' => Item::STATUS_AVAILABLE,
        ]);
    }

    /** @return list<Item> */
    public function findAllForAdmin(): array
    {
        return $this->findBy([], ['createdAt' => 'DESC']);
    }

    /** @return list<Item> */
    public function findByOwner(User $owner): array
    {
        return $this->findBy(['owner' => $owner], ['createdAt' => 'DESC']);
    }
}
