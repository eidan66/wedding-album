import { useState } from 'react';

export const usePhotos = () => {
  const [photos, setPhotos] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const loadMore = async () => {
    setLoading(true);

    // סימולציית API (כאן תוכל להחליף ל-URL אמיתי)
    const simulatedResponse = Array.from(
      { length: 9 },
      (_, i) => `https://picsum.photos/seed/${page}-${i}/400`
    );

    // הדמיית דיליי של רשת
    await new Promise((res) => setTimeout(res, 1000));

    setPhotos((prev) => [...prev, ...simulatedResponse]);
    setPage((prev) => prev + 1);
    setLoading(false);
  };

  return { photos, loadMore, loading };
};

// import { useState } from "react";

// export const usePhotos = () => {
//     const [photos, setPhotos] = useState<string[]>([]);
//     const [page, setPage] = useState(1);

//     const loadMore = async () => {
//         await new Promise((res) => setTimeout(res, 10000)); // סימולציה של טעינה
//         const newPhotos = Array.from({ length: 9 }, (_, i) => `https://picsum.photos/seed/${page}-${i}/400`);
//         setPhotos((prev) => [...prev, ...newPhotos]);
//         setPage((prev) => prev + 1);
//       };

//     // const loadMore = async () => {
//     //   const newPhotos = await fetch(`/api/photos?page=${page}`).then(res => res.json());
//     //   setPhotos((prev) => [...prev, ...newPhotos]);
//     //   setPage((prev) => prev + 1);
//     // };
  
//     return { photos, loadMore };
//   };