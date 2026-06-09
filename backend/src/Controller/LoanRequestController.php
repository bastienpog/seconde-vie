<?php

namespace App\Controller;

use App\Entity\User;
use App\Service\LoanRequestService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\Routing\Attribute\Route;

class LoanRequestController extends AbstractController
{
    #[Route('/api/items/{id}/loan-requests', name: 'api_loan_requests_create', requirements: ['id' => '\d+'], methods: ['POST'])]
    public function create(int $id, LoanRequestService $loanRequestService): JsonResponse
    {
        $user = $this->getConnectedUser();

        if (!$user instanceof User) {
            return $this->json(['message' => 'Authentification requise.'], JsonResponse::HTTP_UNAUTHORIZED);
        }

        try {
            $loanRequest = $loanRequestService->create($id, $user);
        } catch (HttpExceptionInterface $exception) {
            return $this->json(['error' => $exception->getMessage()], $exception->getStatusCode());
        }

        return $this->json($loanRequestService->formatLoanRequest($loanRequest), JsonResponse::HTTP_CREATED);
    }

    #[Route('/api/me/loan-requests/sent', name: 'api_me_loan_requests_sent', methods: ['GET'])]
    public function sent(LoanRequestService $loanRequestService): JsonResponse
    {
        $user = $this->getConnectedUser();

        if (!$user instanceof User) {
            return $this->json(['message' => 'Authentification requise.'], JsonResponse::HTTP_UNAUTHORIZED);
        }

        return $this->json($loanRequestService->listSent($user));
    }

    #[Route('/api/me/loan-requests/received', name: 'api_me_loan_requests_received', methods: ['GET'])]
    public function received(LoanRequestService $loanRequestService): JsonResponse
    {
        $user = $this->getConnectedUser();

        if (!$user instanceof User) {
            return $this->json(['message' => 'Authentification requise.'], JsonResponse::HTTP_UNAUTHORIZED);
        }

        return $this->json($loanRequestService->listReceived($user));
    }

    #[Route('/api/loan-requests/{id}/accept', name: 'api_loan_requests_accept', requirements: ['id' => '\d+'], methods: ['PUT'])]
    public function accept(int $id, LoanRequestService $loanRequestService): JsonResponse
    {
        return $this->answer($id, $loanRequestService, true);
    }

    #[Route('/api/loan-requests/{id}/refuse', name: 'api_loan_requests_refuse', requirements: ['id' => '\d+'], methods: ['PUT'])]
    public function refuse(int $id, LoanRequestService $loanRequestService): JsonResponse
    {
        return $this->answer($id, $loanRequestService, false);
    }

    private function answer(int $id, LoanRequestService $loanRequestService, bool $accept): JsonResponse
    {
        $user = $this->getConnectedUser();

        if (!$user instanceof User) {
            return $this->json(['message' => 'Authentification requise.'], JsonResponse::HTTP_UNAUTHORIZED);
        }

        try {
            $loanRequest = $accept
                ? $loanRequestService->accept($id, $user)
                : $loanRequestService->refuse($id, $user);
        } catch (HttpExceptionInterface $exception) {
            return $this->json(['error' => $exception->getMessage()], $exception->getStatusCode());
        }

        return $this->json($loanRequestService->formatLoanRequest($loanRequest));
    }

    private function getConnectedUser(): ?User
    {
        $user = $this->getUser();

        return $user instanceof User ? $user : null;
    }
}
