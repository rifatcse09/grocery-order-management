<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory', function (Blueprint $table) {
            $table->id();
            $table->string('item_code', 100)->unique();
            $table->string('item_name_en', 200)->nullable();
            $table->string('item_name_bn', 200)->nullable();
            $table->decimal('quantity_on_hand', 14, 3)->default(0);
            $table->decimal('avg_unit_cost', 14, 4)->default(0);
            $table->decimal('min_threshold', 14, 3)->default(0);
            $table->foreignId('supplier_id')->nullable()->constrained('suppliers')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->string('item_code', 100)->index();
            $table->string('item_name_en', 200)->nullable();
            $table->string('item_name_bn', 200)->nullable();
            $table->enum('transaction_type', [
                'purchase_receipt',
                'order_fulfillment',
                'stock_return',
                'damaged_stock',
                'manual_adjustment',
            ])->index();
            $table->decimal('quantity_in', 14, 3)->default(0);
            $table->decimal('quantity_out', 14, 3)->default(0);
            $table->decimal('balance_after', 14, 3)->default(0);
            $table->decimal('unit_cost', 14, 4)->nullable();
            $table->string('reference_type', 80)->nullable();
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->string('reference_no', 100)->nullable();
            $table->foreignId('supplier_id')->nullable()->constrained('suppliers')->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
        Schema::dropIfExists('inventory');
    }
};
