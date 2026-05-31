export type LocationStatus =
  | "potential"
  | "in_review"
  | "negotiating"
  | "owned"
  | "rejected"
  | "archived";

export type AssetType =
  | "retail"
  | "residential"
  | "hotel"
  | "office"
  | "land"
  | "mixed_use"
  | "other";

export interface RealEstateLocation {
  id: string;
  name: string;
  address?: string;
  city: string;
  province: string;
  autonomousCommunity?: string;
  country: "Spain";
  latitude: number;
  longitude: number;
  googleMapsUrl?: string;
  status: LocationStatus;
  assetType: AssetType;
  priority: "low" | "medium" | "high";
  estimatedValue?: number;
  surfaceAreaM2?: number;
  source?: string;
  owner?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
