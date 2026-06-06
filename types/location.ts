export type LocationStatus =
  | "watchlist"
  | "interested"
  | "evaluating"
  | "negotiating"
  | "controlled"
  | "passed"
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
  interestLevel?: "low" | "medium" | "high";
  controlType?: "owned" | "leased" | "option" | "negotiation" | "watchlist" | "none";
  askingPrice?: number;
  targetPrice?: number;
  monthlyRent?: number;
  expectedCapex?: number;
  probability?: number;
  nextAction?: string;
  nextActionDate?: string;
  contactName?: string;
  contactRole?: string;
  contactPhone?: string;
  contactEmail?: string;
  lastContactedAt?: string;
  decisionReason?: string;
  createdAt: string;
  updatedAt: string;
}
