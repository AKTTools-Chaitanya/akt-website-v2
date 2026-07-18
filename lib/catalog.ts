import { config } from './config';

/**
 * Resolves storefront listing slugs → Meilisearch filters + SEO metadata, using the existing
 * react-api category tree / brand list (cached). PHP untouched; this is pure read + map.
 */
const TTL = 600; // 10 min ISR on catalog taxonomy

async function apiGet(path: string): Promise<any | null> {
  try {
    const res = await fetch(`${config.apiBase}/${path}`, { next: { revalidate: TTL } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export interface Brand {
  brand_id: string;
  brand_name: string;
  slug: string;
  brand_image?: string;
  brand_image_path?: string;
}
export interface CategoryMeta {
  cat_id: string;
  cat_name: string;
  slug: string;
  seo_title?: string;
  seo_description?: string;
}
interface TreeSub {
  subcategory_id: string;
  subcategory_name: string;
  subcategory_slug: string;
  Subsubcategories?: { subsubcategory_id: string; subsubcategory_name: string; subsubcategory_slug: string }[];
}
interface TreeCat {
  category_id: string;
  category_name: string;
  category_slug: string;
  Subcategories?: TreeSub[];
}

export async function getBrands(): Promise<Brand[]> {
  const d = await apiGet('api-brands');
  return d?.data?.brands ?? (Array.isArray(d?.data) ? d.data : []);
}
export async function getCategoriesMeta(): Promise<CategoryMeta[]> {
  const d = await apiGet('api-categories');
  return Array.isArray(d?.data) ? d.data : d?.data?.categories ?? [];
}
async function getCategoryTree(): Promise<TreeCat[]> {
  const d = await apiGet('api-categories-relationship');
  return d?.data?.categories ?? [];
}

export type Crumb = { label: string; href: string };

export interface ResolvedListing {
  kind: 'category' | 'subcategory' | 'subsubcategory' | 'brand';
  name: string;
  slug: string;
  filter: string; // Meili filter fragment
  seoTitle?: string;
  seoDescription?: string;
  crumbs: Crumb[];
}

/** Resolve /product-category/<segments…> → a listing spec. Returns null if the slug is unknown. */
export async function resolveListing(segments: string[]): Promise<ResolvedListing | null> {
  if (!segments.length) return null;

  // Brand: /product-category/popular-brands/<brandSlug>
  if (segments[0] === 'popular-brands' && segments[1]) {
    const brands = await getBrands();
    const b = brands.find((x) => x.slug === segments[1]);
    if (!b) return null;
    return {
      kind: 'brand',
      name: b.brand_name,
      slug: b.slug,
      filter: `brand_slug = "${b.slug}"`,
      seoTitle: `${b.brand_name} — Buy online`,
      crumbs: [
        { label: 'Home', href: '/' },
        { label: b.brand_name, href: `/product-category/popular-brands/${b.slug}` },
      ],
    };
  }

  const tree = await getCategoryTree();
  const last = segments[segments.length - 1];

  // Top-level category
  const cat = tree.find((c) => c.category_slug === last);
  if (cat) {
    const meta = (await getCategoriesMeta()).find((c) => c.slug === last);
    return {
      kind: 'category',
      name: cat.category_name,
      slug: last,
      filter: `cat_slug = "${last}"`,
      seoTitle: meta?.seo_title || `${cat.category_name} — AKTTOOLS`,
      seoDescription: meta?.seo_description,
      crumbs: [
        { label: 'Home', href: '/' },
        { label: cat.category_name, href: `/product-category/${last}` },
      ],
    };
  }

  // Subcategory / sub-subcategory
  for (const c of tree) {
    for (const s of c.Subcategories ?? []) {
      if (s.subcategory_slug === last) {
        return {
          kind: 'subcategory',
          name: s.subcategory_name,
          slug: last,
          filter: `scat_slug = "${last}"`,
          seoTitle: `${s.subcategory_name} — ${c.category_name}`,
          crumbs: [
            { label: 'Home', href: '/' },
            { label: c.category_name, href: `/product-category/${c.category_slug}` },
            { label: s.subcategory_name, href: `/product-category/${last}` },
          ],
        };
      }
      for (const ss of s.Subsubcategories ?? []) {
        if (ss.subsubcategory_slug === last) {
          return {
            kind: 'subsubcategory',
            name: ss.subsubcategory_name,
            slug: last,
            filter: `sscat_slug = "${last}"`,
            seoTitle: `${ss.subsubcategory_name} — ${c.category_name}`,
            crumbs: [
              { label: 'Home', href: '/' },
              { label: c.category_name, href: `/product-category/${c.category_slug}` },
              { label: s.subcategory_name, href: `/product-category/${s.subcategory_slug}` },
              { label: ss.subsubcategory_name, href: `/product-category/${last}` },
            ],
          };
        }
      }
    }
  }

  return null;
}
