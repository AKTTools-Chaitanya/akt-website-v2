/** Shapes returned by the existing react-api (kept loose where the PHP response is loose). */

export interface ApiEnvelope<T> {
  status: boolean;
  message?: string;
  errors?: string;
  data?: T;
}

/** akt_product_tbl row as returned by api-product-detail (`data.product`). */
export interface Product {
  pro_id: number | string;
  pro_name: string;
  pro_url: string;
  pro_image: string; // comma-separated full image URLs; first = main
  pro_description: string;
  pro_short_description?: string;
  pro_actual_price: string | number;
  pro_discounted_price: string | number;
  qty: number | string;
  sku?: string;
  brand_id?: number | string;
  cat_id?: number | string;
  weight?: string | number;
  stock_message?: string | null;
  [key: string]: unknown; // tolerate the many other columns the API passes through
}

export interface ProductImage {
  id: number | string;
  pro_id: number | string;
  image?: string;
  pro_image?: string;
  [key: string]: unknown;
}

export interface ProductDetailData {
  product: Product;
  product_images: ProductImage[];
  related_products: Product[];
}

/** Parsed price view for rendering. */
export interface PriceView {
  mrp: number;
  price: number; // what the customer pays
  onSale: boolean;
  discountPct: number;
}

/** ---- Home page (api-home) shapes. Verified against the live react-api response. ---- */
export interface Banner {
  banner_id: string | number;
  title?: string;
  stitle?: string;
  url?: string;
  app_banner_image?: string;
  app_banner_image_path?: string;
}

export interface HomeCategory {
  id: string | number;
  title: string;
  slug: string;
  image?: string;
  image_path?: string;
  category_type?: string; // 'category' | 'subcategory'
}

export interface HomeBrand {
  brand_id: string | number;
  brand_name: string;
  slug: string;
  brand_image?: string;
  brand_image_path?: string;
}

export interface HomeData {
  banners: Banner[];
  trending_categories: HomeCategory[];
  new_arrivals: Product[];
  deal_products: Product[];
  popular_brands: HomeBrand[];
  trending_products: Product[];
  special_offer_products: Product[];
  refrubished_products: Product[];
  combo_deals_products: Product[];
}
