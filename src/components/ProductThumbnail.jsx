import { Package } from "lucide-react";

export default function ProductThumbnail({ product, large = false }) {
  return <span className={`product-thumbnail${large ? " large" : ""}`}>
    {product.image ? <img src={product.image} alt={`${product.name} product`} /> : <Package size={large ? 34 : 20} />}
  </span>;
}