import axiosInstance from ".";


const notifyCountsChanged = () => {
    if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("counts:refresh"));
    }
};

// Add product to cart with variantId
export const addToCartAPI = async ({
    productId,
    variantId,
    quantity,
}: {
    productId: string;
    variantId: string;
    quantity: number;
}) => {
    const response = await axiosInstance.post(`/cart/${productId}/${variantId}`, {
        quantity,
    });
    notifyCountsChanged();
    return response;
};

// Get all products in the cart
export const getAddToCartProductsAPI = () => {
    const response = axiosInstance.get(`/cart`);
    return response;
};

// Delete product from cart with variantId
export const deleteToCartAPI = async ({
    productId,
    variantId,
}: {
    productId: string;
    variantId: string;
}) => {
    const response = await axiosInstance.delete(`/cart/${productId}/${variantId}`);
    notifyCountsChanged();
    return response;
};

// Update product quantity in cart with variantId
export const updateToCartAPI = async ({
    productId,
    variantId,
    quantity,
}: {
    productId: string;
    variantId: string;
    quantity: number;
}) => {
    const response = await axiosInstance.put(`/cart/${productId}/${variantId}`, {
        quantity,
    });
    notifyCountsChanged();
    return response;
};