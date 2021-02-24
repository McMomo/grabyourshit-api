export type Station = {
  id: string;
  isFilled: boolean;
  filledLastTime: number;
  location: Array<string>;
  nearestAddress: Address;
  responsible: Array<any>; //should be Docreference or Helper
}

export type Address = {
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