<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\AdminUserStoreRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminUserController extends Controller
{
    private function toFrontend(User $user): array
    {
        return [
            'id' => (string) $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'role' => $user->role,
            'billingAddress' => $user->billing_address,
            'deliveryAddress' => $user->delivery_address,
            'isActive' => (bool) $user->is_active,
        ];
    }

    public function index(Request $request): JsonResponse
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $users = User::query()->latest('id')->get()->map(fn (User $u) => $this->toFrontend($u));
        return response()->json(['data' => $users]);
    }

    public function store(AdminUserStoreRequest $request): JsonResponse
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $data = $request->validated();

        $created = User::create([
            'name' => $data['name'],
            'email' => strtolower($data['email']),
            'password' => $data['password'],
            'phone' => $data['phone'] ?? '',
            'role' => $data['role'],
            'billing_address' => $data['billingAddress'] ?? '',
            'delivery_address' => $data['deliveryAddress'] ?? '',
            'is_active' => true,
        ]);

        return response()->json(['data' => $this->toFrontend($created)], 201);
    }
}
