interface Product {
    id: string;
    title: string;
    description: string;
    price: number;
  }

  interface Stock {
    product_id: string;
    count: number;
  }

  interface CombinedProduct extends Product {
    count: number;
  }