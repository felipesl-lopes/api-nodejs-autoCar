// interfaces

export interface IFormLogin {
  email: string;
  password: string;
}

export interface IUser {
  email: string;
  name: string;
  uid: string;
  whatsapp: string;
  uf: string;
  city: string;
}

interface CarImages {
  name: string;
  uid: string;
  url: string;
}

export interface ICarList {
  uidUser: string;
  id: string;
  name: string;
  year: string;
  price: string;
  city: string;
  km: string;
  images: string;
  uf: string;
  model: string;
}

export interface ISliders_Home {
  route: string;
  url: string;
  color: string;
}
export interface IFormNewCar {
  inputFile?: string;
  name: string;
  model: string;
  year: string;
  km: string;
  price: string;
  city: string;
  uf: string;
  whatsapp: string;
  description: string;
  fuel: string;
  transmission: string;
  engine: string;
  documentationStatus: string;
  maintenanceHistory: string;
  generalCondition: string;
  created: string;
  owner: string;
  uidUser: string;
  images: CarImages[];
}
