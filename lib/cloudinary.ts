const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UNSIGNED_UPLOAD_PRESET = 'tab_unsigned';

// Uploads vindos do app (foto de produto, logo) usam um preset "unsigned" do Cloudinary —
// CLOUDINARY_API_SECRET nunca é exposto ao bundle, só é usado em scripts/Node (server-side).
export async function uploadImageToCloudinary(uri: string, folder: string): Promise<string> {
  const formData = new FormData();
  // Data URIs (ex: saída do remove.bg) vão como string; arquivos locais vão como descritor {uri,type,name}
  if (uri.startsWith('data:')) {
    formData.append('file', uri);
  } else {
    formData.append('file', { uri, type: 'image/jpeg', name: 'upload.jpg' } as unknown as Blob);
  }
  formData.append('upload_preset', UNSIGNED_UPLOAD_PRESET);
  formData.append('folder', folder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Falha no upload para o Cloudinary: ${errText}`);
  }
  const data = await res.json();
  return data.secure_url as string;
}

// Serve uma imagem remota (ex: Unsplash) através do CDN do Cloudinary sem precisar fazer upload.
export function toCloudinaryFetchUrl(remoteUrl: string): string {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/fetch/${encodeURIComponent(remoteUrl)}`;
}
