<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_returns', function (Blueprint $table) {
            $table->id();
            $table->string('item_code', 100)->index();
            $table->string('item_name_en', 200)->nullable();
            $table->string('item_name_bn', 200)->nullable();
            $table->decimal('quantity', 14, 3);
            $table->foreignId('supplier_id')->nullable()->constrained('suppliers')->nullOnDelete();
            $table->text('return_reason');
            $table->date('return_date');
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
        });

        Schema::create('damaged_stock', function (Blueprint $table) {
            $table->id();
            $table->string('item_code', 100)->index();
            $table->string('item_name_en', 200)->nullable();
            $table->string('item_name_bn', 200)->nullable();
            $table->decimal('quantity', 14, 3);
            $table->text('damage_reason');
            $table->date('damage_date');
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('damaged_stock');
        Schema::dropIfExists('stock_returns');
    }
};
