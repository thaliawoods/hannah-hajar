import { cdnUrl } from "@/lib/bunny";

export type MediaItem = {
  type: "image" | "video";
  src: string;
  label?: string;
};

export const IMAGE_ITEMS: MediaItem[] = [
  { type: "image", src: cdnUrl("/2025_03_22%20Ed%27E_Hannah%20Ajar_18.JPG"), label: "2025_03_22 Ed'E_Hannah Ajar_18.JPG" },
  { type: "image", src: cdnUrl("/2025_03_22%20Ed%27E_Hannah%20Ajar_23.JPG"), label: "2025_03_22 Ed'E_Hannah Ajar_23.JPG" },
  { type: "image", src: cdnUrl("/2025_03_22%20Ed%27E_Hannah%20Ajar_37.JPG"), label: "2025_03_22 Ed'E_Hannah Ajar_37.JPG" },
  { type: "image", src: cdnUrl("/8.png"), label: "8.png" },
  { type: "image", src: cdnUrl("/de661b02-e20f-442c-8760-84a4761eead9.JPG"), label: "de661b02-e20f-442c-8760-84a4761eead9.JPG" },
  { type: "image", src: cdnUrl("/DSC03563.jpeg"), label: "DSC03563.jpeg" },
  { type: "image", src: cdnUrl("/DSC03571.jpeg"), label: "DSC03571.jpeg" },
  { type: "image", src: cdnUrl("/DSC03583.jpeg"), label: "DSC03583.jpeg" },
  { type: "image", src: cdnUrl("/DSC03585.jpeg"), label: "DSC03585.jpeg" },
  { type: "image", src: cdnUrl("/DSC03592.jpeg"), label: "DSC03592.jpeg" },
  { type: "image", src: cdnUrl("/DSC03613.jpeg"), label: "DSC03613.jpeg" },
  { type: "image", src: cdnUrl("/DSC03614.jpeg"), label: "DSC03614.jpeg" },
  { type: "image", src: cdnUrl("/DSC03616.jpeg"), label: "DSC03616.jpeg" },
  { type: "image", src: cdnUrl("/DSC03617.jpeg"), label: "DSC03617.jpeg" },
  { type: "image", src: cdnUrl("/DSC03621.jpeg"), label: "DSC03621.jpeg" },
  { type: "image", src: cdnUrl("/DSC1.JPG"), label: "DSC1.JPG" },
  { type: "image", src: cdnUrl("/hh_pix_doc.JPEG"), label: "hh_pix_doc.JPEG" },
  { type: "image", src: cdnUrl("/hh8.jpg"), label: "hh8.jpg" },
  { type: "image", src: cdnUrl("/IMG_2858.JPG"), label: "IMG_2858.JPG" },
  { type: "image", src: cdnUrl("/IMG_2861.JPG"), label: "IMG_2861.JPG" },
  { type: "image", src: cdnUrl("/IMG_2862.JPG"), label: "IMG_2862.JPG" },
  { type: "image", src: cdnUrl("/IMG_2864.JPG"), label: "IMG_2864.JPG" },
  { type: "image", src: cdnUrl("/IMG_9177.JPG"), label: "IMG_9177.JPG" },
  { type: "image", src: cdnUrl("/relais.JPG"), label: "relais.JPG" },
];

export const VIDEO_ITEMS: MediaItem[] = [
  { type: "video", src: cdnUrl("/DSC2.MP4"), label: "DSC2.MP4" },
  { type: "video", src: cdnUrl("/DSC4.MP4"), label: "DSC4.MP4" },
  { type: "video", src: cdnUrl("/DSC6.MP4"), label: "DSC6.MP4" },
  { type: "video", src: cdnUrl("/DSC9.MP4"), label: "DSC9.MP4" },
  { type: "video", src: cdnUrl("/IMG_0393.MOV"), label: "IMG_0393.MOV" },
  { type: "video", src: cdnUrl("/IMG_0394.MOV"), label: "IMG_0394.MOV" },
  { type: "video", src: cdnUrl("/IMG_6586.MOV"), label: "IMG_6586.MOV" },
  { type: "video", src: cdnUrl("/IMG_6588.MOV"), label: "IMG_6588.MOV" },
  { type: "video", src: cdnUrl("/IMG_6590.MOV"), label: "IMG_6590.MOV" },
  { type: "video", src: cdnUrl("/IMG_8714.MOV"), label: "IMG_8714.MOV" },
];

export const ARCHIVE_ITEMS: MediaItem[] = IMAGE_ITEMS;
