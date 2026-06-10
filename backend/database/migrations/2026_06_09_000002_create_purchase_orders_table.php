<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_orders', function (Blueprint $table) {
            $table->id();
            $table->string('po_number', 50)->unique();
            $table->foreignId('supplier_id')->constrained('suppliers');
            $table->date('purchase_date');
            $table->date('expected_receipt_date')->nullable();
            $table->enum('status', ['draft', 'confirmed', 'partially_received', 'received', 'cancelled'])->default('draft');
            $table->decimal('total_cost', 14, 2)->default(0);
            $table->text('remarks')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('purchase_order_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_order_id')->constrained('purchase_orders')->cascadeOnDelete();
            $table->string('item_code', 100);
            $table->string('item_name_en', 200)->nullable();
            $table->string('item_name_bn', 200)->nullable();
            $table->decimal('quantity', 14, 3);
            $table->decimal('unit_cost', 14, 2);
            $table->decimal('total_cost', 14, 2)->storedAs('quantity * unit_cost');
            $table->decimal('received_quantity', 14, 3)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_order_lines');
        Schema::dropIfExists('purchase_orders');
    }
};
