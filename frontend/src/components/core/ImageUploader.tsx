import React, { useState } from 'react';

type ImageUploaderProps = {
  onImageSelect: (file: File) => void;
};

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelect }) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageSelect(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  return (
    <div className="image-uploader flex flex-col items-center gap-4">
      {imagePreview && (
        <div className="image-preview mb-4">
          <img
            src={imagePreview}
            alt="Selected Preview"
            className="rounded-md shadow-md max-w-full h-auto"
          />
        </div>
      )}
      <div>
        <label
          htmlFor="file-input"
          className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition"
        >
          Upload Image
        </label>
        <input
          id="file-input"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default ImageUploader;
