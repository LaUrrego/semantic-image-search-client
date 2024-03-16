// requesting width only to ensure aspect ratio is maintained
// Docker instance of imgProxy 
export const createImgproxyUrl = (imageUrl, width) => {
    const encodeURL = 
    encodeURIComponent(imageUrl);
    return `http://localhost:8080/insecure/resize:fit:${width}:0/plain/${encodeURL}@webp`;
};
