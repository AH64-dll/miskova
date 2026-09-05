import { PatronDispatch } from "@/types/reviews";
import { BASE_PATH } from "@/utils/basePath";

export const patronDispatches: PatronDispatch[] = [
  {
    id: "dispatch-01",
    cdnUrl: "https://files.easy-orders.net/1788302251306527349.jpg",
    localPath: `${BASE_PATH}/assets/reviews/dispatch-1.jpg`,
    altText: "Customer review screenshot 1",
    title: "Customer Review 01",
  },
  {
    id: "dispatch-02",
    cdnUrl: "https://files.easy-orders.net/1788302251750243228.jpg",
    localPath: `${BASE_PATH}/assets/reviews/dispatch-2.jpg`,
    altText: "Customer review screenshot 2",
    title: "Customer Review 02",
  },
  {
    id: "dispatch-03",
    cdnUrl: "https://files.easy-orders.net/1788302251482485995.jpg",
    localPath: `${BASE_PATH}/assets/reviews/dispatch-3.jpg`,
    altText: "Customer review screenshot 3",
    title: "Customer Review 03",
  },
  {
    id: "dispatch-04",
    cdnUrl: "https://files.easy-orders.net/1788302251261451546.jpg",
    localPath: `${BASE_PATH}/assets/reviews/dispatch-4.jpg`,
    altText: "Customer review screenshot 4",
    title: "Customer Review 04",
  },
  {
    id: "dispatch-05",
    cdnUrl: "https://files.easy-orders.net/1788302251451491716.jpg",
    localPath: `${BASE_PATH}/assets/reviews/dispatch-5.jpg`,
    altText: "Customer review screenshot 5",
    title: "Customer Review 05",
  },
];
