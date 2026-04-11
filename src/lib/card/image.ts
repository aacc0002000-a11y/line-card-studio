import { activeCardRepositoryMode } from "@/lib/card/repository";
import { buildCardStoragePath } from "@/lib/storage/paths";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;

export async function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("無法讀取圖片"));
    };

    reader.onerror = () => reject(new Error("讀取圖片時發生錯誤"));
    reader.readAsDataURL(file);
  });
}

export function validateImageFile(file: File) {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      message: "僅支援 JPG、PNG、WEBP 圖片格式。",
    };
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return {
      valid: false,
      message: "圖片建議控制在 2MB 以內。",
    };
  }

  return { valid: true, message: "" };
}

export function getImagePreviewSrc(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

export async function persistCardImageFile(
  file: File,
  options: { field: "avatar" | "logo" | "cover"; cardId?: string },
) {
  if (activeCardRepositoryMode === "local") {
    return fileToDataUrl(file);
  }

  const client = getSupabaseBrowserClient();
  const env = getSupabasePublicEnv();

  if (!client) {
    throw new Error("Supabase client 未設定完成，無法上傳圖片");
  }

  const extension = getFileExtension(file);
  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("請先登入後再上傳圖片");
  }

  const objectPath = buildCardStoragePath({
    userId: user.id,
    cardId: options.cardId,
    field: options.field,
    extension,
  });
  const uploadResult = await client.storage
    .from(env.bucket)
    .upload(objectPath, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type,
    });

  if (uploadResult.error) {
    throw uploadResult.error;
  }

  const publicUrlResult = client.storage.from(env.bucket).getPublicUrl(objectPath);

  return publicUrlResult.data.publicUrl;
}

function getFileExtension(file: File) {
  const byName = file.name.split(".").pop()?.toLowerCase();

  if (byName) {
    return byName;
  }

  if (file.type === "image/png") {
    return "png";
  }

  if (file.type === "image/webp") {
    return "webp";
  }

  return "jpg";
}

export const imageUploadHint = "支援 JPG / PNG / WEBP，建議 2MB 以內";
