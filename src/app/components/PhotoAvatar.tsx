import { useState, useEffect } from "react";

interface PhotoAvatarProps {
  photoUrl?: string;
  name: string;
  size?: "card" | "profile";
  className?: string;
  isJsonResponse?: boolean;
}

export function PhotoAvatar({ photoUrl, name, size = "card", className = "", isJsonResponse = false }: PhotoAvatarProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [actualPhotoUrl, setActualPhotoUrl] = useState<string | undefined>(photoUrl);

  useEffect(() => {
    if (photoUrl && isJsonResponse) {
      // Fetch the JSON response to get the actual photo URL
      setIsLoading(true);
      fetch(photoUrl)
        .then(res => res.json())
        .then(data => {
          if (data.photo_url) {
            setActualPhotoUrl(data.photo_url);
            setIsLoading(false);
          } else {
            setHasError(true);
            setIsLoading(false);
          }
        })
        .catch(() => {
          setHasError(true);
          setIsLoading(false);
        });
    } else if (photoUrl) {
      setActualPhotoUrl(photoUrl);
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, [photoUrl, isJsonResponse]);

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const hasPhoto = actualPhotoUrl && !hasError;

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  if (size === "card") {
    return (
      <div className={`w-full h-72 bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-2xl overflow-hidden relative group ${className}`}>
        {/* Loading skeleton */}
        {isLoading && (
          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
        )}

        {/* Photo image */}
        {hasPhoto && !isLoading && (
          <img
            src={actualPhotoUrl}
            alt={name}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        )}

        {/* Fallback avatar with initials */}
        {!hasPhoto && !isLoading && (
          <div className="w-full h-full bg-gradient-to-br from-blue-400 via-blue-500 to-cyan-600 flex items-center justify-center">
            <span className="text-7xl font-bold text-white opacity-80">{initials}</span>
          </div>
        )}
      </div>
    );
  }

  // Profile size
  return (
    <div className={`w-full h-96 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl overflow-hidden relative ${className}`}>
      {/* Loading skeleton */}
      {isLoading && (
        <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
      )}

      {/* Photo image */}
      {hasPhoto && !isLoading && (
        <img
          src={actualPhotoUrl}
          alt={name}
          className="w-full h-full object-contain"
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      )}

      {/* Fallback avatar with initials */}
      {!hasPhoto && !isLoading && (
        <div className="w-full h-full bg-gradient-to-br from-blue-400 via-blue-500 to-cyan-600 flex items-center justify-center">
          <span className="text-9xl font-bold text-white opacity-80">{initials}</span>
        </div>
      )}
    </div>
  );
}
