export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  image: string;
  available: boolean;
  isFeatured: boolean;
  stock?: number;
}

export interface Ingredient {
  id: string;
  name: string;
  stock: number;
  unit: string;
  minThreshold: number;
}

export interface Testimonial {
  id: string;
  name: string;
  rating: number;
  text: string;
  role: string;
  image: string;
}

export interface Promotion {
  title: string;
  description: string;
  code: string;
  endDate: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  items: OrderItem[];
  deliveryOption: string;
  date: string;
  status: 'Pending' | 'Baking' | 'Ready' | 'Delivered';
  total: number;
  specialRequests?: string;
  paymentReference?: string;
  paymentChannel?: string;
  deliveryFee?: number;
  deliveryAddress?: string;
  landmark?: string;
}

export interface BakeryStory {
  title: string;
  tagline: string;
  mainText: string;
  secondaryText: string;
  ecoTitle: string;
  ecoText: string;
}

export interface BakeryAddress {
  street: string;
  suite: string;
  city: string;
  hours: string;
  hoursClosed: string;
  phone: string;
  email: string;
}

export interface AdminProfile {
  name: string;
  role: string;
  avatar: string;
  bio: string;
}

export interface WebsiteData {
  story: BakeryStory;
  address: BakeryAddress;
  profile: AdminProfile;
  promotion: Promotion;
  testimonials: Testimonial[];
}

export type CartItem = Product & { quantity: number };

export interface Inquiry {
  id: string;
  name: string;
  email: string;
  message: string;
  date: string;
  read?: boolean;
  inspirationImage?: string;
}
