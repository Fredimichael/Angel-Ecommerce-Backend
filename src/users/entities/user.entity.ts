import { Entity, PrimaryGeneratedColumn, Column, Unique } from 'typeorm';

@Entity()
@Unique(['username'])
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  username: string; // Campo obligatorio

  @Column()
  password: string;

  @Column({ 
    type: 'enum',
    enum: ['superadmin', 'admin', 'seller', 'custom'],
    default: 'seller'
  })
  role: string;

  @Column({ default: true })
  mustChangePassword: boolean;
}