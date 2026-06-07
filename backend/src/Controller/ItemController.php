<?php

namespace App\Controller;

use App\Entity\User;
use App\Service\ItemService;
use App\Service\ItemValidationException;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\Routing\Attribute\Route;

class ItemController extends AbstractController
{
    #[Route('/api/items', name: 'api_items_create', methods: ['POST'])]
    public function create(Request $request, ItemService $itemService): JsonResponse
    {
        $user = $this->getUser();

        if (!$user instanceof User) {
            return $this->json(['message' => 'Authentification requise.'], JsonResponse::HTTP_UNAUTHORIZED);
        }

        $data = json_decode($request->getContent(), true);

        if (!is_array($data)) {
            return $this->json([
                'error' => 'Invalid data',
                'details' => [
                    'body' => 'Le body JSON est invalide.',
                ],
            ], JsonResponse::HTTP_BAD_REQUEST);
        }

        try {
            $item = $itemService->create($data, $user);
        } catch (ItemValidationException $exception) {
            return $this->json([
                'error' => $exception->getMessage(),
                'details' => $exception->getDetails(),
            ], JsonResponse::HTTP_BAD_REQUEST);
        } catch (HttpExceptionInterface $exception) {
            return $this->json([
                'error' => $exception->getMessage(),
            ], $exception->getStatusCode());
        }

        return $this->json($itemService->formatItem($item), JsonResponse::HTTP_CREATED);
    }
}
