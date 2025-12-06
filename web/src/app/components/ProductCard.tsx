import Image from 'next/image';
import Link from 'next/link';

interface ProductProps {
  slug: string;
  name: string;
  price_cents: number;
  price_before_cents?: number;
  image: string;
  brand: string;
  offer_tag?: string;
}

export default function ProductCard({ product }: { product: ProductProps }) {
  const discount = product.price_before_cents 
    ? Math.round(((product.price_before_cents - product.price_cents) / product.price_before_cents) * 100)
    : 0;

  return (
    <Link href={`/products/${product.slug}`} className="group block bg-white hover:shadow-lg transition-shadow duration-300 border border-transparent hover:border-gray-100">
      <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
        {product.offer_tag && (
          <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur text-[10px] font-bold px-2 py-1 text-primary uppercase tracking-wider">
            {product.offer_tag}
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-bold text-sm text-gray-900 truncate">{product.brand}</h3>
        <p className="text-xs text-gray-500 truncate mb-1">{product.name}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm font-bold text-gray-900">
            ${(product.price_cents / 100).toFixed(2)}
          </span>
          {product.price_before_cents && (
            <>
              <span className="text-xs text-gray-400 line-through">
                ${(product.price_before_cents / 100).toFixed(2)}
              </span>
              <span className="text-xs text-orange-500 font-bold">
                ({discount}% OFF)
              </span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}