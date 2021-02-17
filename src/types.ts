export type Station = {
  id: string;
  isFilled: boolean;
  filledLastTime: number;
  location: Array<string>;
  nearestAddress?: Address;
  responsible: Array<Helper>;  
}

export type Address = {
  country?: string;
  city: string;
  street: string;
  zip?: string;
}

export type Helper = {
  name: string;
  email: string;
  phone: string;
  address?: Address; 
}