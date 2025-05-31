export enum GenderType {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
  PREFER_NOT_TO_SAY = 'PREFER_NOT_TO_SAY',
}

export enum BehaviorRating {
  EXCELLENT = 'EXCELLENT',
  GOOD = 'GOOD',
  FAIR = 'FAIR',
  POOR = 'POOR',
  UNACCEPTABLE = 'UNACCEPTABLE',
}

export class Client {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: Date | null;
  gender: GenderType | null;
  email: string | null;
  phone: string;
  address: string;
  country: string;
  state: string;
  city: string;
  postalCode: string;
  dni: string | null;
  cuil: string | null;
  creditLimit: number;
  cashLimit: number;
  currentBalance: number;
  behaviorRating: BehaviorRating;
  serviceReceipt: string | null; // Ahora almacena el número de factura de luz
  notes: string | null;
  isWholesale: boolean;
  registeredThroughCheckout: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastPurchaseAt: Date | null;
}