<?php

namespace App\Repository;

use App\Entity\LoanRequest;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<LoanRequest>
 */
class LoanRequestRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, LoanRequest::class);
    }

    /** @return list<LoanRequest> */
    public function findSentByBorrower(User $borrower): array
    {
        return $this->findBy(['borrower' => $borrower], ['createdAt' => 'DESC']);
    }

    /** @return list<LoanRequest> */
    public function findReceivedByOwner(User $owner): array
    {
        return $this->createQueryBuilder('loanRequest')
            ->join('loanRequest.item', 'item')
            ->andWhere('item.owner = :owner')
            ->setParameter('owner', $owner)
            ->orderBy('loanRequest.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }
}
