export type MediaItem = {
  type: "image" | "video";
  src: string;
  label?: string;
};

export const IMAGE_ITEMS: MediaItem[] = [
  { type: "image", src: "/images/hannah-01.jpg", label: "Hannah 01" },
  { type: "image", src: "/images/hannah-02.jpg", label: "Hannah 02" },
  { type: "image", src: "/images/hannah-03.jpg", label: "Hannah 03" },
  { type: "image", src: "/images/hannah-04.png", label: "Hannah 04" },
  { type: "image", src: "/images/hannah-05.png", label: "Hannah 05" },
  { type: "image", src: "/images/hannah-06.png", label: "Hannah 06" },
  { type: "image", src: "/images/hannah-07.png", label: "Hannah 07" },
  { type: "image", src: "/images/hannah-08.png", label: "Hannah 08" },
  { type: "image", src: "/images/hannah-09.png", label: "Hannah 09" },
  { type: "image", src: "/images/hannah-10.png", label: "Hannah 10" },
  { type: "image", src: "/images/hannah-11.png", label: "Hannah 11" },
  { type: "image", src: "/images/hannah-12.png", label: "Hannah 12" },
  { type: "image", src: "/images/hannah-13.png", label: "Hannah 13" },
  { type: "image", src: "/images/hannah-14.png", label: "Hannah 14" },
  { type: "image", src: "/images/hannah-15.png", label: "Hannah 15" },
  { type: "image", src: "/images/hannah-16.png", label: "Hannah 16" },
  { type: "image", src: "/images/hannah-17.png", label: "Hannah 17" },
  { type: "image", src: "/images/hannah-18.png", label: "Hannah 18" },
  { type: "image", src: "/images/key.jpg", label: "Key" },
  { type: "image", src: "/images/rouge.png", label: "Rouge" }
];

export const LIVE_ITEMS: MediaItem[] = [
  { type: "video", src: "/video/live-select.mp4", label: "Live Select" }
];

export const CONCERT_ITEMS: MediaItem[] = [
  { type: "video", src: "/video/concert_1.MOV", label: "Concert 1" },
  { type: "video", src: "/video/concert_2.MOV", label: "Concert 2" },
  { type: "video", src: "/video/concert_3.MOV", label: "Concert 3" },
  { type: "video", src: "/video/concert_4.MOV", label: "Concert 4" },
  { type: "video", src: "/video/concert_5.MOV", label: "Concert 5" }
];

export const ARCHIVE_ITEMS: MediaItem[] = IMAGE_ITEMS;
