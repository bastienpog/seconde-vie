<?php

namespace App\Repository;

use App\Entity\Item;
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
    public function findAvailable(): array
    {
        return $this->findBy(['status' => Item::STATUS_AVAILABLE], ['createdAt' => 'DESC']);
    }

    public function findAvailableById(int $id): ?Item
    {
        return $this->findOneBy([
            'id' => $id,
            'status' => Item::STATUS_AVAILABLE,
        ]);
    }
}
