import { supabaseUrl } from "@/lib/supabase/env";

export const IMAGE_BUCKET = "images";
export const MAX_WISH_IMAGES = 4;

export function imageUrl(path: string) {
  return `${supabaseUrl}/storage/v1/object/public/${IMAGE_BUCKET}/${path}`;
}
