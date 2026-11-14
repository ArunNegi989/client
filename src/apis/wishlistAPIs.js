import axiosInstance from ".";


const notifyCountsChanged = () => {
    if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("counts:refresh"));
    }
};

export const addToWishListAPI = async (productId) => {
    const response = await axiosInstance.post(`/users/wishlist`, {
        productId: productId,
    });
    notifyCountsChanged();
    return response;
};

export const getWishListAPI = () => {
    const response = axiosInstance.get(`/users/wishlist`);
    return response;
};

export const updateUserWishlistAPI = async (productIds) => {
    const response = await axiosInstance.patch(`/users/wishlist`, {
        productIds,
    });
    notifyCountsChanged();
    return response;
};

export const deleteProductFromWishlistAPI = async (productId) => {
    const response = await axiosInstance.delete(`/users/wishlist/${productId}`);
    notifyCountsChanged();
    return response;
};