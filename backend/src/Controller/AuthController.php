<?php

namespace App\Controller;

use App\Entity\User;
use App\Service\AuthService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\Routing\Attribute\Route;

class AuthController extends AbstractController
{
    #[Route('/api/register', name: 'api_register', methods: ['POST'])]
    public function register(Request $request, AuthService $authService): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (!is_array($data)) {
            throw new BadRequestHttpException('Le body JSON est invalide.');
        }

        try {
            $authService->register($data['email'] ?? null, $data['password'] ?? null, $data['name'] ?? null);
        } catch (HttpExceptionInterface $exception) {
            return $this->json(
                ['message' => $exception->getMessage()],
                $exception->getStatusCode(),
            );
        }

        return $this->json(['message' => 'Utilisateur créé avec succès'], JsonResponse::HTTP_CREATED);
    }

    #[Route('/api/me', name: 'api_me', methods: ['GET'])]
    public function me(): JsonResponse
    {
        $user = $this->getUser();

        if (!$user instanceof User) {
            return $this->json(['message' => 'Authentification requise.'], JsonResponse::HTTP_UNAUTHORIZED);
        }

        return $this->json([
            'id' => $user->getId(),
            'email' => $user->getEmail(),
            'name' => $user->getName(),
            'roles' => $user->getRoles(),
        ]);
    }
}
