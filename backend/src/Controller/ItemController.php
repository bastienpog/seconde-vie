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
    #[Route('/api/items', name: 'api_items_list', methods: ['GET'])]
    public function list(Request $request, ItemService $itemService): JsonResponse
    {
        $category = $request->query->get('category');
        $categoryId = filter_var($category, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);

        return $this->json($itemService->list(
            $this->normalizeQueryParam($request->query->get('search')),
            $categoryId === false ? null : $categoryId,
            $this->normalizeQueryParam($request->query->get('city')),
        ));
    }

    #[Route('/api/admin/items', name: 'api_admin_items_list', methods: ['GET'])]
    public function listForAdmin(ItemService $itemService): JsonResponse
    {
        return $this->json($itemService->listForAdmin());
    }

    #[Route('/api/me/items', name: 'api_me_items_list', methods: ['GET'])]
    public function listMine(ItemService $itemService): JsonResponse
    {
        $user = $this->getUser();

        if (!$user instanceof User) {
            return $this->json(['message' => 'Authentification requise.'], JsonResponse::HTTP_UNAUTHORIZED);
        }

        return $this->json($itemService->listOwnedBy($user));
    }

    #[Route('/api/items/{id}', name: 'api_items_detail', requirements: ['id' => '\d+'], methods: ['GET'])]
    public function detail(int $id, ItemService $itemService): JsonResponse
    {
        try {
            return $this->json($itemService->getAvailableItem($id));
        } catch (HttpExceptionInterface $exception) {
            return $this->json([
                'error' => $exception->getMessage(),
            ], $exception->getStatusCode());
        }
    }

    #[Route('/api/items', name: 'api_items_create', methods: ['POST'])]
    public function create(Request $request, ItemService $itemService): JsonResponse
    {
        $user = $this->getUser();

        if (!$user instanceof User) {
            return $this->json(['message' => 'Authentification requise.'], JsonResponse::HTTP_UNAUTHORIZED);
        }

        $data = $this->decodeJsonBody($request);

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

    #[Route('/api/items/{id}', name: 'api_items_update', requirements: ['id' => '\d+'], methods: ['PUT'])]
    public function update(int $id, Request $request, ItemService $itemService): JsonResponse
    {
        $user = $this->getUser();

        if (!$user instanceof User) {
            return $this->json(['message' => 'Authentification requise.'], JsonResponse::HTTP_UNAUTHORIZED);
        }

        $data = $this->decodeJsonBody($request);

        if (!is_array($data)) {
            return $this->json([
                'error' => 'Invalid data',
                'details' => [
                    'body' => 'Le body JSON est invalide.',
                ],
            ], JsonResponse::HTTP_BAD_REQUEST);
        }

        try {
            $item = $itemService->update($id, $data, $user);
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

        return $this->json($itemService->formatItem($item));
    }

    #[Route('/api/admin/items/{id}', name: 'api_admin_items_delete', requirements: ['id' => '\d+'], methods: ['DELETE'])]
    public function deleteForAdmin(int $id, ItemService $itemService): JsonResponse
    {
        $user = $this->getUser();

        if (!$user instanceof User) {
            return $this->json(['message' => 'Authentification requise.'], JsonResponse::HTTP_UNAUTHORIZED);
        }

        try {
            $itemService->delete($id, $user);
        } catch (HttpExceptionInterface $exception) {
            return $this->json([
                'error' => $exception->getMessage(),
            ], $exception->getStatusCode());
        }

        return $this->json(null, JsonResponse::HTTP_NO_CONTENT);
    }

    #[Route('/api/items/{id}', name: 'api_items_delete', requirements: ['id' => '\d+'], methods: ['DELETE'])]
    public function delete(int $id, ItemService $itemService): JsonResponse
    {
        $user = $this->getUser();

        if (!$user instanceof User) {
            return $this->json(['message' => 'Authentification requise.'], JsonResponse::HTTP_UNAUTHORIZED);
        }

        try {
            $itemService->delete($id, $user);
        } catch (HttpExceptionInterface $exception) {
            return $this->json([
                'error' => $exception->getMessage(),
            ], $exception->getStatusCode());
        }

        return $this->json(null, JsonResponse::HTTP_NO_CONTENT);
    }

    /** @return array<string, mixed>|null */
    private function decodeJsonBody(Request $request): ?array
    {
        $data = json_decode($request->getContent(), true);

        return is_array($data) ? $data : null;
    }

    private function normalizeQueryParam(mixed $value): ?string
    {
        if (!is_scalar($value)) {
            return null;
        }

        $value = trim((string) $value);

        return $value === '' ? null : $value;
    }
}
