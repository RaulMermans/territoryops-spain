import type { RealEstateLocation } from "@/types/location";
import { isArchived } from "./locations";

export type AttentionReason = "overdue" | "missingAction" | "negotiatingNoContact";

export interface AttentionItem {
  location: RealEstateLocation;
  reasons: AttentionReason[];
}

export function getAttentionItems(locations: RealEstateLocation[]): AttentionItem[] {
  const today = new Date().toISOString().slice(0, 10);

  return locations
    .filter((location) => !isArchived(location))
    .flatMap((location) => {
      const reasons: AttentionReason[] = [];

      if (location.nextActionDate && location.nextActionDate < today) {
        reasons.push("overdue");
      }
      if (!location.nextAction?.trim()) {
        reasons.push("missingAction");
      }
      if (location.status === "negotiating" && !location.contactName?.trim()) {
        reasons.push("negotiatingNoContact");
      }

      return reasons.length > 0 ? [{ location, reasons }] : [];
    });
}

export const attentionReasonLabel: Record<AttentionReason, string> = {
  overdue: "Overdue",
  missingAction: "Missing action",
  negotiatingNoContact: "No contact"
};
