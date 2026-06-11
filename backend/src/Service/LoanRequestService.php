<?php

namespace App\Service;

use App\Entity\Item;
use App\Entity\LoanRequest;
use App\Entity\User;
use App\Repository\ItemRepository;
use App\Repository\LoanRequestRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
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

    /** @param array<string, mixed> $data */
    public function create(int $itemId, array $data, User $borrower): LoanRequest
    {
        $item = $this->itemRepository->findAvailableById($itemId);

        if ($item === null) {
            throw new NotFoundHttpException("L'objet demandé est introuvable.");
        }

        if ($item->getOwner()?->getId() === $borrower->getId()) {
            throw new ConflictHttpException('Vous ne pouvez pas demander votre propre objet.');
        }

        $dates = $this->validateDates($data);

        $loanRequest = new LoanRequest();
        $loanRequest->setItem($item);
        $loanRequest->setBorrower($borrower);
        $loanRequest->setStatus(LoanRequest::STATUS_PENDING);
        $loanRequest->setStartDate($dates['startDate']);
        $loanRequest->setEndDate($dates['endDate']);

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
            'startDate' => $loanRequest->getStartDate()->format('Y-m-d'),
            'endDate' => $loanRequest->getEndDate()->format('Y-m-d'),
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

    /** @return array{startDate: \DateTimeImmutable, endDate: \DateTimeImmutable} */
    private function validateDates(array $data): array
    {
        $startDate = $this->parseRequiredDate($data['startDate'] ?? null, 'La date de début est obligatoire.');
        $endDate = $this->parseRequiredDate($data['endDate'] ?? null, 'La date de fin est obligatoire.');

        if ($endDate < $startDate) {
            throw new BadRequestHttpException('La date de fin doit être supérieure ou égale à la date de début.');
        }

        return [
            'startDate' => $startDate,
            'endDate' => $endDate,
        ];
    }

    private function parseRequiredDate(mixed $value, string $requiredMessage): \DateTimeImmutable
    {
        if (!is_string($value) || trim($value) === '') {
            throw new BadRequestHttpException($requiredMessage);
        }

        $date = \DateTimeImmutable::createFromFormat('!Y-m-d', trim($value));
        $errors = \DateTimeImmutable::getLastErrors();

        if (!$date instanceof \DateTimeImmutable || ($errors !== false && ($errors['warning_count'] > 0 || $errors['error_count'] > 0))) {
            throw new BadRequestHttpException('Les dates doivent respecter le format YYYY-MM-DD.');
        }

        return $date;
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
