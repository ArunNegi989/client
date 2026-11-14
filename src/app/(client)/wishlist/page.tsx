"use client";

import { addToCartAPI } from "@/apis/addToCartAPIs";
import {
  deleteProductFromWishlistAPI,
  getWishListAPI,
} from "@/apis/wishlistAPIs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface WishlistItemProps {
  imageSrc: string;
  secondaryImageSrc: string;
  title: string;
  price: string;
  originalPrice?: number;
  discount?: number;
  productId: string;
  variantId: string;
  onRemove: () => void;
  onMoveToCart: () => Promise<void>;
  onBuyNow: () => Promise<void>;
}

const WishlistItem = ({
  imageSrc,
  secondaryImageSrc,
  title,
  price,
  productId,
  onRemove,
  onMoveToCart,
  onBuyNow,
}: WishlistItemProps) => {
  const router = useRouter();
  const [hovered, setHovered] = useState(false);
  const [moving, setMoving] = useState(false);
  const [buying, setBuying] = useState(false);

  const busy = moving || buying;

  const handleMove = async () => {
    if (busy) return;
    setMoving(true);
    try {
      await onMoveToCart();
    } finally {
      setMoving(false);
    }
  };

  const handleBuyNow = async () => {
    if (busy) return;
    setBuying(true);
    try {
      await onBuyNow();
    } finally {
      setBuying(false);
    }
  };

  return (
    <div
      className="group bg-white rounded-xl shadow-sm overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5 duration-300 border border-gray-100 flex flex-col"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image Section */}
      <div className="relative overflow-hidden cursor-pointer">
        <img
          src={hovered ? secondaryImageSrc : imageSrc}
          alt={title}
          className="w-full aspect-square object-cover rounded-t-xl transition-all duration-300"
          onClick={() => router.push(`/products/${productId}`)}
        />
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-sm text-red-500 hover:text-red-600 hover:scale-110 transition-all duration-300"
          aria-label="Remove from Wishlist"
        >
          <Trash2 size={20} />
        </button>
      </div>
      {/* Content Section */}
      <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
        <div className="space-y-2">
          <h3
            className="text-gray-800 text-sm font-medium group-hover:text-[#7A6E18] transition-colors line-clamp-2 cursor-pointer"
            title={title}
            onClick={() => router.push(`/products/${productId}`)}
          >
            {title}
          </h3>
          <div className="flex items-baseline gap-1">
            <span className="text-[#556b2f] font-bold text-sm">
              ₹{parseFloat(price).toFixed(2)}
            </span>
          </div>
        </div>
        <div className="space-y-2">
          <Button
            className="w-full rounded-full text-xs font-medium transition-all bg-[#556b2f] text-white hover:bg-[#3c5216] disabled:opacity-60"
            onClick={handleMove}
            disabled={busy}
          >
            {moving ? "Moving..." : "Move to Cart"}
          </Button>
          <Button
            className="w-full rounded-full text-xs font-medium transition-all bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-60"
            onClick={handleBuyNow}
            disabled={busy}
          >
            {buying ? "Please wait..." : "Buy Now"}
          </Button>
        </div>
      </div>
    </div>
  );
};

const WishlistPage = () => {
  const router = useRouter();
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch wishlist data
  const getWishList = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const response = await getWishListAPI();
      if (response.data && response.data.data) {
        setWishlist(response.data.data.product_id);
        setError(null);
      } else {
        setError("No items found in your wishlist.");
      }
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      setError("Failed to fetch wishlist. Please try again later.");
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    getWishList();
  }, []);

  // Remove an item from the wishlist
  const removeFromWishlist = async (productId: string) => {
    try {
      await deleteProductFromWishlistAPI(productId);
      setWishlist((prev) => prev.filter((item) => item._id !== productId));
      toast.success("Item removed from wishlist!");
    } catch (error) {
      console.error("Error removing product:", error);
      toast.info("Failed to remove item. Please try again.");
    }
  };

  // Move item: add to cart, then remove from wishlist
  const moveToCart = async (productId: string, variantId: string) => {
    try {
      await addToCartAPI({ productId, variantId, quantity: 1 });
    } catch (error: any) {
      toast.info(error?.response?.data?.message || "Failed to add to cart.");
      return;
    }

    try {
      await deleteProductFromWishlistAPI(productId);
    } catch (error) {
      console.error("Added to cart but failed to remove from wishlist:", error);
    }

    setWishlist((prev) => prev.filter((item) => item._id !== productId));
    toast.success("Moved to cart!");
  };

  // Buy now: add to cart, remove from wishlist, go to checkout
  const buyNow = async (productId: string, variantId: string) => {
    try {
      await addToCartAPI({ productId, variantId, quantity: 1 });
    } catch (error: any) {
      const message: string = error?.response?.data?.message || "";
      const alreadyInCart =
        error?.response?.status === 409 || /already/i.test(message);

      if (!alreadyInCart) {
        toast.info(message || "Failed to proceed to checkout.");
        return;
      }
    }

    try {
      await deleteProductFromWishlistAPI(productId);
    } catch (error) {
      console.error("Failed to remove from wishlist:", error);
    }

    router.push("/checkout");
  };

  // Get primary variant
  const getPrimaryVariant = (variants: any[]) => {
    const activeDiscountVariant = variants.find(
      (v) => v.discount?.active && v.discount?.value
    );
    return activeDiscountVariant || variants[0];
  };

  return (
    <div className="container mar mx-auto py-12 md:py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50 min-h-screen">
      {/* Page Title */}
      <h1 className="text-center text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-10 md:mb-14 tracking-tight">
        Your Wishlist
      </h1>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse border border-gray-100"
            >
              <Skeleton className="w-full aspect-square rounded-t-xl" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-8 w-full rounded-full" />
                <Skeleton className="h-8 w-full rounded-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="text-center mt-12 md:mt-16">
          <Heart
            size={80}
            className="text-gray-200 mx-auto mb-6 animate-pulse"
          />
          <p className="text-lg md:text-xl text-red-500 font-medium">{error}</p>
        </div>
      )}

      {/* Wishlist Items */}
      {!loading && !error && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {wishlist.length > 0 ? (
              wishlist.map((item) => {
                const primaryVariant = getPrimaryVariant(item.variants);
                const price = parseFloat(primaryVariant.price.$numberDecimal);
                const discount =
                  primaryVariant.discount?.active &&
                  primaryVariant.discount?.value
                    ? primaryVariant.discount.value
                    : 0;
                const originalPrice = discount
                  ? price / (1 - discount / 100)
                  : undefined;

                return (
                  <WishlistItem
                    key={item._id}
                    imageSrc={
                      item.images.find((img: any) => img.sequence === 0)?.url ||
                      "/placeholder-image.jpg"
                    }
                    secondaryImageSrc={
                      item.images.find((img: any) => img.sequence === 1)?.url ||
                      item.images.find((img: any) => img.sequence === 0)?.url ||
                      "/placeholder-image.jpg"
                    }
                    title={`${item.name} - ${primaryVariant.name}`}
                    price={primaryVariant.price.$numberDecimal}
                    originalPrice={originalPrice}
                    discount={discount}
                    productId={item._id}
                    variantId={primaryVariant._id}
                    onRemove={() => removeFromWishlist(item._id)}
                    onMoveToCart={() =>
                      moveToCart(item._id, primaryVariant._id)
                    }
                    onBuyNow={() => buyNow(item._id, primaryVariant._id)}
                  />
                );
              })
            ) : (
              <div className="text-center mt-12 md:mt-16 col-span-full">
                <Heart
                  size={80}
                  className="text-gray-200 mx-auto mb-6 animate-bounce"
                />
                <h3 className="text-xl md:text-2xl font-semibold text-gray-800 mb-2">
                  Your Wishlist is Empty
                </h3>
                <p className="text-base md:text-lg text-gray-500 leading-relaxed">
                  Start adding your favorite products to make it yours!
                </p>
              </div>
            )}
          </div>

          {/* Browse Products Button */}
          {!wishlist.length && (
            <div className="flex justify-center mt-10 md:mt-12">
              <Button
                className="bg-[#556b2f] hover:bg-[#405816]/90 text-white px-6 md:px-8 py-3 md:py-4 text-base md:text-lg font-semibold rounded-full shadow-lg transition-all duration-300 transform hover:scale-105"
                onClick={() => (window.location.href = "/products")}
              >
                Explore Products
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WishlistPage;