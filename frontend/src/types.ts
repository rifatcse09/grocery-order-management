export type Role = "user" | "moderator" | "admin";

export type OrderStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "delivered"
  | "invoiced";

export interface CatalogItem {
  id: string;
  categoryId: string;
  nameBn: string;
  nameEn: string;
}

export interface CategoryDef {
  id: string;
  nameBn: string;
  nameEn: string;
  items: CatalogItem[];
}

export interface OrderLine {
  id: string;
  serial: number;
  categoryId: string;
  itemId: string;
  itemNameBn: string;
  itemNameEn: string;
  kg: string;
  gram: string;
  piece: string;
  unitPrice?: number;
  lineTotal?: number;
}

export interface Order {
  id: string;
  /** Procurement requester (prototype) */
  ownerId?: string;
  orderNo: string;
  orderDate: string;
  /** ISO timestamp when the user confirmed submit (optional on legacy / seed data). */
  submittedAt?: string;
  deliveryDate: string;
  deliveryTime?: string;
  status: OrderStatus;
  billingAddress: string;
  deliveryAddress: string;
  contactPerson: string;
  phone: string;
  lines: OrderLine[];
  signatureDataUrl?: string | null;
  challanGenerated?: boolean;
  invoiceGenerated?: boolean;
  subtotal?: number;
  markupPercent?: number;
  grandTotal?: number;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  billingAddress: string;
  deliveryAddress: string;
}
