<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\CatalogStoreCategoryRequest;
use App\Http\Requests\Api\CatalogStoreItemRequest;
use App\Models\CatalogItem;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CatalogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $categories = Category::query()
            ->where('is_active', true)
            ->with(['items' => fn ($q) => $q->where('is_active', true)->orderBy('name_en')])
            ->orderBy('name_en')
            ->get()
            ->map(static function (Category $category): array {
                return [
                    'id' => $category->code,
                    'nameBn' => $category->name_bn,
                    'nameEn' => $category->name_en,
                    'markupPercent' => (float)$category->markup_percent,
                    'items' => $category->items->map(static fn ($item): array => [
                        'id' => $item->code,
                        'categoryId' => $category->code,
                        'nameBn' => $item->name_bn,
                        'nameEn' => $item->name_en,
                    ])->values(),
                ];
            })
            ->values();

        return response()->json(['data' => $categories]);
    }

    public function storeCategory(CatalogStoreCategoryRequest $request): JsonResponse
    {
        $user = $request->user();
        if (!$user || !in_array($user->role, ['admin', 'moderator'], true)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $data = $request->validated();
        $code = 'custom-cat-' . now()->timestamp . '-' . random_int(100, 999);
        $category = Category::query()->create([
            'code' => $code,
            'name_bn' => $data['nameBn'],
            'name_en' => $data['nameEn'],
            'markup_percent' => 0,
            'is_active' => true,
        ]);
        return response()->json([
            'data' => [
                'id' => $category->code,
                'nameBn' => $category->name_bn,
                'nameEn' => $category->name_en,
                'markupPercent' => (float)$category->markup_percent,
                'items' => [],
            ],
        ], 201);
    }

    public function storeItem(CatalogStoreItemRequest $request): JsonResponse
    {
        $user = $request->user();
        if (!$user || !in_array($user->role, ['admin', 'moderator'], true)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $data = $request->validated();
        $category = Category::query()->where('code', $data['categoryId'])->first();
        if (!$category) {
            return response()->json(['message' => 'Category not found'], 404);
        }
        $code = 'custom-' . $category->code . '-' . now()->timestamp . '-' . random_int(100, 999);
        $item = CatalogItem::query()->create([
            'category_id' => $category->id,
            'code' => $code,
            'name_bn' => $data['nameBn'],
            'name_en' => $data['nameEn'],
            'is_active' => true,
        ]);
        return response()->json([
            'data' => [
                'id' => $item->code,
                'categoryId' => $category->code,
                'nameBn' => $item->name_bn,
                'nameEn' => $item->name_en,
            ],
        ], 201);
    }
}
