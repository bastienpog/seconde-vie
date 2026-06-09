<?php

namespace App\Service;

use App\Entity\Item;
use App\Entity\LoanRequest;
use App\Entity\User;
use App\Repository\ItemRepository;
use App\Repository\LoanRequestRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class LoanRequestService
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly ItemRepository $itemRepository,
        private readonly LoanRequestRepository $loanRequestRepository,
    ) {
    }

    public function create(int $itemId, User $borrower): LoanRequest
    {
        $item = $this->itemRepository->findAvailableById($itemId);

        if ($item === null) {
            throw new NotFoundHttpException("L'objet demandé est introuvable.");
        }

        if ($item->getOwner()?->getId() === $borrower->getId()) {
            throw new ConflictHttpException('Vous ne pouvez pas demander votre propre objet.');
        }

        $loanRequest = new LoanRequest();
        $loanRequest->setItem($item);
        $loanRequest->setBorrower($borrower);
        $loanRequest->setStatus(LoanRequest::STATUS_PENDING);

        $this->entityManager->persist($loanRequest);
        $this->entityManager->flush();

        return $loanRequest;
    }

    /** @return list<array<string, mixed>> */
    public function listSent(User $borrower): array
    {
        return array_map(
            fn (LoanRequest $loanRequest): array => $this->formatLoanRequest($loanRequest),
            $this->loanRequestRepository->findSentByBorrower($borrower),
        );
    }

    /** @return list<array<string, mixed>> */
    public function listReceived(User $owner): array
    {
        return array_map(
            fn (LoanRequest $loanRequest): array => $this->formatLoanRequest($loanRequest),
            $this->loanRequestRepository->findReceivedByOwner($owner),
        );
    }

    public function accept(int $id, User $owner): LoanRequest
    {
        return $this->answer($id, $owner, LoanRequest::STATUS_ACCEPTED);
    }

    public function refuse(int $id, User $owner): LoanRequest
    {
        return $this->answer($id, $owner, LoanRequest::STATUS_REFUSED);
    }

    /** @return array<string, mixed> */
    public function formatLoanRequest(LoanRequest $loanRequest): array
    {
        return [
            'id' => $loanRequest->getId(),
            'status' => $loanRequest->getStatus(),
            'item' => $this->formatItem($loanRequest->getItem()),
            'borrower' => $this->formatUser($loanRequest->getBorrower()),
            'createdAt' => $loanRequest->getCreatedAt()->format(\DateTimeInterface::ATOM),
            'updatedAt' => $loanRequest->getUpdatedAt()->format(\DateTimeInterface::ATOM),
        ];
    }

    private function answer(int $id, User $owner, string $status): LoanRequest
    {
        $loanRequest = $this->loanRequestRepository->find($id);

        if ($loanRequest === null) {
            throw new NotFoundHttpException("La demande d'emprunt est introuvable.");
        }

        if ($loanRequest->getItem()?->getOwner()?->getId() !== $owner->getId()) {
            throw new AccessDeniedHttpException("Vous ne pouvez pas traiter cette demande d'emprunt.");
        }

        $loanRequest->setStatus($status);
        $this->entityManager->flush();

        return $loanRequest;
    }

    /** @return array<string, mixed>|null */
    private function formatItem(?Item $item): ?array
    {
        if ($item === null) {
            return null;
        }

        return [
            'id' => $item->getId(),
            'title' => $item->getTitle(),
            'city' => $item->getCity(),
            'owner' => $this->formatUser($item->getOwner()),
        ];
    }

    /** @return array{id: int|null, email: string|null}|null */
    private function formatUser(?User $user): ?array
    {
        if ($user === null) {
            return null;
        }

        return [
            'id' => $user->getId(),
            'email' => $user->getEmail(),
        ];
    }
}
