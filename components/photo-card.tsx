"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";
import { PublicPhoto } from "@/lib/types/public";

interface PhotoCardProps {
  photo: PublicPhoto;
  likes: Record<string, boolean>;
  likeBusy: Record<string, boolean>;
  toggleLike: (photoId: string) => void;
  addComment: (photoId: string) => void;
  commentingOn: string | null;
  user: { id: string; full_name: string | null } | null;
}

export default function PhotoCard({
  photo,
  likes,
  likeBusy,
  toggleLike,
  addComment,
  commentingOn,
  user,
}: {
  photo: PublicPhoto;
  likes: Record<string, boolean>;
  likeBusy: Record<string, boolean>;
  toggleLike: (photoId: string) => void;
  addComment: (photoId: string) => void;
  commentingOn: string | null;
  user: { id: string; full_name: string | null } | null;
}) {
  return (
    <div key={photo.id} className="relative group rounded-sm overflow-hidden bg-surface-2 aspect-square cursor-pointer">
      <img src={photo.image_url || photo.thumbnail_url || "/api/photos/placeholder"} alt={photo.title || "Photo"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/0 transition-opacity duration-300 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <span className="text-white font-bold text-lg">{photo.title || "Photo"}</span>
          <div className="flex gap-2 mt-2">
            <button onClick={() => toggleLike(photo.id)} className={`p-2 rounded bg-black/50 hover:bg-black/70 text-white ${likes[photo.id] ? "text-orange" : ""}`}>
              <span>❤️</span>
              <span className="text-xs ml-1">{likes[photo.id] ? "Liked" : "Like"}</span>
            </button>
            <button onClick={() => {}} className="p-2 rounded bg-black/50 hover:bg-black/70 text-white text-sm">
              <span>💬</span>
            </button>
          </div>
        </div>
      </div>
      <Link href={`/photos/${photo.id}`} className="absolute inset-0 z-10" />
    </div>
  );
}