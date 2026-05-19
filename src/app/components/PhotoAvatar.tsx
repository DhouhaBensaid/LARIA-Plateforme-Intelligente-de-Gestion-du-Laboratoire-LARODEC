import { useState } from "react";

interface PhotoAvatarProps {
  photoUrl?: string;
  name: string;
  size?: "card" | "profile";
  className?: string;
}

export function PhotoAvatar({ photoUrl, name, size = "card", className = "" }: PhotoAvatarProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const hasPhoto = photoUrl && !hasError;

  if (size === "card") {
    return (
      <div className={`w-full h-72 bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-2xl overflow-hidden relative group ${className}`}>
        {/* Loading skeleton */}
        {isLoading && !hasPhoto && (
          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
        )}

        {/* Photo image */}
        {hasPhoto && (
          <img
            src={photoUrl}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setHasError(true);
            }}
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
      {isLoading && !hasPhoto && (
        <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
      )}

      {/* Photo image */}
      {hasPhoto && (
        <img
          src={photoUrl}
          alt={name}
          className="w-full h-full object-cover"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
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
