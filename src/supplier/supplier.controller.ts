import { Controller, Get, Post, Body, Param, Put, Delete, ParseIntPipe } from '@nestjs/common';
import { SupplierService } from './supplier.service';
import { Supplier } from '@prisma/client';

@Controller('suppliers')
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @Post()
  async createSupplier(@Body() data: Supplier): Promise<Supplier> {
    return this.supplierService.createSupplier(data);
  }

  @Get()
  async getSuppliers(): Promise<Supplier[]> {
    return this.supplierService.getSuppliers();
  }

  @Get(':id')
  async getSupplierById(@Param('id', ParseIntPipe) id: number): Promise<Supplier> {
    return this.supplierService.getSupplierById(id);
  }

  @Put(':id')
  async updateSupplier(@Param('id', ParseIntPipe) id: number, @Body() data: Supplier): Promise<Supplier> {
    return this.supplierService.updateSupplier(id, data);
  }

  @Delete(':id')
  async deleteSupplier(@Param('id', ParseIntPipe) id: number): Promise<Supplier> {
    return this.supplierService.deleteSupplier(id);
  }
}