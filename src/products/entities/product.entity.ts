import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  price: number;

  @Column()
  stock: number;

  @Column()
  code: string;

  @Column()
  barcode: string;

  @Column()
  shippingInfo: string;

  @Column('simple-array')
  suppliers: string[];

  @Column()
  commission: number;

  @Column()
  cost: number;

  @Column()
  tax: number;

  @Column()
  brand: string;

  @Column()
  weightKg: number;

  @Column()
  unitsPerBox: number;

  @Column()
  unitsPerBulk: number;

  @Column()
  subcategoryId: number;
}