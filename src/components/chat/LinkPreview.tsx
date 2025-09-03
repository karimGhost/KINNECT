import { useEffect, useState } from "react";

export default function LinkPreview({ url }: { url: any }) {
  const [preview, setPreview] = useState<null | {
    title: string;
    description: string;
    image: string;
    url: string;
  }>(null);

  useEffect(() => {
    if (!url) return;
    const fetchPreview = async () => {
      const res = await fetch(`/api/preview?url=${encodeURIComponent(url)}`);
      if (res.ok) {
        const data = await res.json();
        setPreview(data);
      }
    };
    fetchPreview();
  }, [url]);

  if (!preview) return null;

  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 block border rounded-xl overflow-hidden shadow hover:shadow-lg transition bg-white max-w-md"
    >
      {preview.image && (
        <img src={preview.image} alt="preview" className="w-full h-40 object-cover" />
      )}

      
      <div className="p-3">
        <p className="font-bold text-gray-800 text-sm">{preview.title}</p>
        <p className="text-gray-600 text-xs mt-1 line-clamp-2">{preview.description}</p>
        <p className="text-blue-500 text-xs mt-2 break-words whitespace-pre-wrap break-all">{preview.url}</p>
      </div>
    </a>
  );
}




