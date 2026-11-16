import * as PortfolioRepo from "@/lib/repositories/portfolio.repository";
import * as PortfolioItemRepo from "@/lib/repositories/portfolio-item.repository";
import * as PhotoRepo from "@/lib/repositories/photo.repository";

/**
 * Portfolio business logic.
 *
 * Pass authenticatedPhotographerId from the server-side session. Never accept
 * it directly from an untrusted request body.
 */

export async function createPhotographerPortfolio(input: {
  authenticatedPhotographerId: string;
  title: string;
  slug: string;
  description?: string | null;
  theme?: string | null;
  isPublic?: boolean;
}) {
  const title = input.title.trim();
  const slug = input.slug.trim().toLowerCase();

  if (!input.authenticatedPhotographerId) {
    throw new Error("Authentication is required");
  }
  if (!title) throw new Error("Portfolio title is required");
  if (!slug) throw new Error("Portfolio slug is required");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error("Portfolio slug can contain only lowercase letters, numbers, and hyphens");
  }

  return PortfolioRepo.createPortfolio({
    photographer_id: input.authenticatedPhotographerId,
    title,
    slug,
    description: input.description?.trim() || null,
    theme: input.theme?.trim() || null,
    is_public: input.isPublic ?? true,
  });
}

export async function getPortfolio(portfolioId: string) {
  if (!portfolioId) throw new Error("Portfolio ID is required");
  return PortfolioRepo.getPortfolioById(portfolioId);
}

export async function listPublicPortfolios(limit = 50, offset = 0) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new Error("Limit must be an integer between 1 and 100");
  }
  if (!Number.isInteger(offset) || offset < 0) {
    throw new Error("Offset must be a non-negative integer");
  }
  return PortfolioRepo.listPublicPortfolios(limit, offset);
}

export async function listPhotographerPortfolios(photographerId: string, limit = 50, offset = 0) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new Error("Limit must be an integer between 1 and 100");
  }
  if (!Number.isInteger(offset) || offset < 0) {
    throw new Error("Offset must be a non-negative integer");
  }
  if (!photographerId) throw new Error("Authentication is required");
  return PortfolioRepo.listPortfoliosByPhotographer(photographerId, limit, offset);
}

export async function updatePhotographerPortfolio(input: {
  portfolioId: string;
  authenticatedPhotographerId: string;
  title?: string | null;
  slug?: string | null;
  description?: string | null;
  theme?: string | null;
  isPublic?: boolean;
}) {
  const portfolio = await PortfolioRepo.getPortfolioById(input.portfolioId);
  if (!portfolio) throw new Error("Portfolio not found");
  if (portfolio.photographer_id !== input.authenticatedPhotographerId) {
    throw new Error("You are not allowed to update this portfolio");
  }

  const patch: {
    title?: string;
    slug?: string;
    description?: string | null;
    theme?: string | null;
    is_public?: boolean;
  } = {};

  if (input.title !== undefined) {
    const title = input.title?.trim() ?? "";
    if (!title) throw new Error("Portfolio title cannot be empty");
    patch.title = title;
  }
  if (input.slug !== undefined) {
    const slug = input.slug?.trim().toLowerCase() ?? "";
    if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      throw new Error("Portfolio slug can contain only lowercase letters, numbers, and hyphens");
    }
    patch.slug = slug;
  }
  if (input.description !== undefined) patch.description = input.description?.trim() || null;
  if (input.theme !== undefined) patch.theme = input.theme?.trim() || null;
  if (input.isPublic !== undefined) patch.is_public = input.isPublic;

  return PortfolioRepo.updatePortfolio(input.portfolioId, patch);
}

export async function deletePhotographerPortfolio(input: {
  portfolioId: string;
  authenticatedPhotographerId: string;
}) {
  const portfolio = await PortfolioRepo.getPortfolioById(input.portfolioId);
  if (!portfolio) throw new Error("Portfolio not found");
  if (portfolio.photographer_id !== input.authenticatedPhotographerId) {
    throw new Error("You are not allowed to delete this portfolio");
  }

  // The database foreign-key behavior determines whether portfolio_items
  // cascade on deletion. Configure ON DELETE CASCADE if that is intended.
  return PortfolioRepo.deletePortfolio(input.portfolioId);
}

export async function getPortfolioPhotos(portfolioId: string) {
  const portfolio = await PortfolioRepo.getPortfolioById(portfolioId);
  if (!portfolio) throw new Error("Portfolio not found");
  return PortfolioItemRepo.listPortfolioItems(portfolioId);
}

export async function addPhotoToPhotographerPortfolio(input: {
  portfolioId: string;
  photoId: string;
  authenticatedPhotographerId: string;
  displayOrder?: number;
}) {
  const portfolio = await PortfolioRepo.getPortfolioById(input.portfolioId);
  if (!portfolio) throw new Error("Portfolio not found");
  if (portfolio.photographer_id !== input.authenticatedPhotographerId) {
    throw new Error("You are not allowed to modify this portfolio");
  }

  const photo = await PhotoRepo.getPhotoById(input.photoId);
  if (!photo) throw new Error("Photo not found");
  if (photo.photographer_id !== input.authenticatedPhotographerId) {
    throw new Error("You can only add your own photos to your portfolio");
  }

  const displayOrder = input.displayOrder ?? 0;
  if (!Number.isInteger(displayOrder) || displayOrder < 0) {
    throw new Error("Display order must be a non-negative integer");
  }

  return PortfolioItemRepo.addPhotoToPortfolio(
    input.portfolioId,
    input.photoId,
    displayOrder,
  );
}

export async function removePhotoFromPhotographerPortfolio(input: {
  portfolioId: string;
  photoId: string;
  authenticatedPhotographerId: string;
}) {
  const portfolio = await PortfolioRepo.getPortfolioById(input.portfolioId);
  if (!portfolio) throw new Error("Portfolio not found");
  if (portfolio.photographer_id !== input.authenticatedPhotographerId) {
    throw new Error("You are not allowed to modify this portfolio");
  }

  return PortfolioItemRepo.removePhotoFromPortfolio(input.portfolioId, input.photoId);
}

export async function reorderPortfolioPhoto(input: {
  portfolioId: string;
  portfolioItemId: string;
  authenticatedPhotographerId: string;
  displayOrder: number;
}) {
  const portfolio = await PortfolioRepo.getPortfolioById(input.portfolioId);
  if (!portfolio) throw new Error("Portfolio not found");
  if (portfolio.photographer_id !== input.authenticatedPhotographerId) {
    throw new Error("You are not allowed to modify this portfolio");
  }
  if (!Number.isInteger(input.displayOrder) || input.displayOrder < 0) {
    throw new Error("Display order must be a non-negative integer");
  }

  // The current repository method updates by item ID only. Verify that the
  // item belongs to this portfolio before changing its order.
  const items = await PortfolioItemRepo.listPortfolioItems(input.portfolioId);
  const itemBelongsToPortfolio = items.some((item) => item.id === input.portfolioItemId);
  if (!itemBelongsToPortfolio) throw new Error("Portfolio item not found");

  return PortfolioItemRepo.updatePortfolioItemOrder(
    input.portfolioItemId,
    input.displayOrder,
  );
}
