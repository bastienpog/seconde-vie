<?php

namespace App\Controller;

use App\Entity\Category;
use App\Repository\CategoryRepository;
use App\Service\CategoryService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\Routing\Attribute\Route;

class CategoryController extends AbstractController
{
    #[Route('/api/categories', name: 'api_categories_list', methods: ['GET'])]
    public function list(CategoryRepository $categoryRepository): JsonResponse
    {
        return $this->json(array_map(
            fn (Category $category): array => [
                'id' => $category->getId(),
                'name' => $category->getName(),
                'slug' => $category->getSlug(),
            ],
            $categoryRepository->findBy([], ['name' => 'ASC']),
        ));
    }

    #[Route('/api/admin/categories', name: 'api_admin_categories_create', methods: ['POST'])]
    public function create(Request $request, CategoryService $categoryService): JsonResponse
    {
        $data = $this->decodeJsonBody($request);

        if (!is_array($data)) {
            return $this->json(['message' => 'Le body JSON est invalide.'], JsonResponse::HTTP_BAD_REQUEST);
        }

        try {
            $category = $categoryService->create($data);
        } catch (HttpExceptionInterface $exception) {
            return $this->json(['message' => $exception->getMessage()], $exception->getStatusCode());
        }

        return $this->json($categoryService->formatCategory($category), JsonResponse::HTTP_CREATED);
    }

    #[Route('/api/admin/categories/{id}', name: 'api_admin_categories_update', requirements: ['id' => '\d+'], methods: ['PUT'])]
    public function update(int $id, Request $request, CategoryService $categoryService): JsonResponse
    {
        $data = $this->decodeJsonBody($request);

        if (!is_array($data)) {
            return $this->json(['message' => 'Le body JSON est invalide.'], JsonResponse::HTTP_BAD_REQUEST);
        }

        try {
            $category = $categoryService->update($id, $data);
        } catch (HttpExceptionInterface $exception) {
            return $this->json(['message' => $exception->getMessage()], $exception->getStatusCode());
        }

        return $this->json($categoryService->formatCategory($category));
    }

    #[Route('/api/admin/categories/{id}', name: 'api_admin_categories_delete', requirements: ['id' => '\d+'], methods: ['DELETE'])]
    public function delete(int $id, CategoryService $categoryService): JsonResponse
    {
        try {
            $categoryService->delete($id);
        } catch (HttpExceptionInterface $exception) {
            return $this->json(['message' => $exception->getMessage()], $exception->getStatusCode());
        }

        return $this->json(null, JsonResponse::HTTP_NO_CONTENT);
    }

    /** @return array<string, mixed>|null */
    private function decodeJsonBody(Request $request): ?array
    {
        $data = json_decode($request->getContent(), true);

        return is_array($data) ? $data : null;
    }
}
