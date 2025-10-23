export interface Product {
    id: string;
    title: string;
    price: number;
    description: string;
  }
  
  const mockProducts: Product[] = [
    { id: "1", title: "Product 1", price: 100, description: "This is product 1" },
    { id: "2", title: "Product 2", price: 200, description: "This is product 2" },
    { id: "3", title: "Product 3", price: 300, description: "This is product 3" },
  ];
  
  export class ProductService {
    static getAll(): Product[] {
      return mockProducts;
    }
  
    static getById(productId: string): Product | undefined {
      return mockProducts.find((p) => p.id === productId);
    }
  }
  