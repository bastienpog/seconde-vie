<?php

namespace App\Controller;

use App\Service\AdminUserService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\Routing\Attribute\Route;

class AdminUserController extends AbstractController
{
    #[Route('/api/admin/users/promote', name: 'api_admin_users_promote', methods: ['POST'])]
    public function promote(Request $request, AdminUserService $adminUserService): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (!is_array($data)) {
            return $this->json(['message' => 'Le body JSON est invalide.'], JsonResponse::HTTP_BAD_REQUEST);
        }

        try {
            $user = $adminUserService->promoteByEmail($data['email'] ?? null);
        } catch (HttpExceptionInterface $exception) {
            return $this->json(['message' => $exception->getMessage()], $exception->getStatusCode());
        }

        return $this->json($adminUserService->formatUser($user));
    }
}
