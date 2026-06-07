import { describe, it, expect } from "vitest";
import {
  parseLocationsImport,
  parseLocationsCsv,
  exportLocationsToCsv,
  needsAttentionCount,
  getDataHealth,
  isRealEstateLocation,
  csvColumns,
  formatCurrency,
  formatArea
} from "@/lib/locations";
import { getAttentionItems } from "@/lib/attention";
import { sortLocations } from "@/lib/table";
import { groupByPipelineStatus } from "@/lib/pipeline";
import { extractCoordinatesFromGoogleMapsUrl } from "@/lib/googleMaps";
import type { RealEstateLocation } from "@/types/location";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeLocation(overrides: Partial<RealEstateLocation> = {}): RealEstateLocation {
  return {
    id: "test-001",
    name: "Test Location",
    city: "Madrid",
    province: "Madrid",
    country: "Spain",
    latitude: 40.4168,
    longitude: -3.7038,
    status: "interested",
    assetType: "retail",
    priority: "medium",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides
  };
}

// ---------------------------------------------------------------------------
// 1. Status migration
// ---------------------------------------------------------------------------

describe("status migration via parseLocationsImport", () => {
  const legacyCases: Array<[string, RealEstateLocation["status"]]> = [
    ["potential", "interested"],
    ["in_review", "evaluating"],
    ["owned", "controlled"],
    ["rejected", "passed"],
    ["scouted", "interested"],
    ["contacted", "evaluating"],
    ["under_review", "evaluating"],
    ["closed_lost", "passed"]
  ];

  for (const [legacyStatus, expectedStatus] of legacyCases) {
    it(`migrates "${legacyStatus}" to "${expectedStatus}"`, () => {
      const raw = [makeLocation({ status: legacyStatus as RealEstateLocation["status"] })];
      const result = parseLocationsImport(raw);
      expect(result).not.toBeNull();
      expect(result![0].status).toBe(expectedStatus);
    });
  }

  it("passes through new statuses unchanged", () => {
    const newStatuses: RealEstateLocation["status"][] = [
      "watchlist", "interested", "evaluating", "negotiating", "controlled", "passed", "archived"
    ];

    for (const status of newStatuses) {
      const result = parseLocationsImport([makeLocation({ status })]);
      expect(result).not.toBeNull();
      expect(result![0].status).toBe(status);
    }
  });

  it("rejects records with an unknown status", () => {
    const raw = [makeLocation({ status: "bogus_status" as RealEstateLocation["status"] })];
    const result = parseLocationsImport(raw);
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 2. JSON import compatibility
// ---------------------------------------------------------------------------

describe("parseLocationsImport", () => {
  it("accepts an array of valid locations", () => {
    const result = parseLocationsImport([makeLocation()]);
    expect(result).toHaveLength(1);
    expect(result![0].name).toBe("Test Location");
  });

  it("accepts {locations: [...]} envelope format", () => {
    const result = parseLocationsImport({ locations: [makeLocation()] });
    expect(result).toHaveLength(1);
  });

  it("returns null for empty array", () => {
    expect(parseLocationsImport([])).toBeNull();
  });

  it("returns null if any record is invalid", () => {
    const bad = { ...makeLocation(), latitude: 999 };
    expect(parseLocationsImport([bad])).toBeNull();
  });

  it("accepts new optional business-control fields", () => {
    const loc = makeLocation({
      interestLevel: "high",
      controlType: "option",
      askingPrice: 500000,
      targetPrice: 450000,
      probability: 70,
      nextAction: "Sign LOI",
      contactName: "Maria Garcia"
    });
    const result = parseLocationsImport([loc]);
    expect(result).not.toBeNull();
    expect(result![0].interestLevel).toBe("high");
    expect(result![0].probability).toBe(70);
    expect(result![0].contactName).toBe("Maria Garcia");
  });

  it("strips undefined optional fields gracefully (old records without new fields)", () => {
    const oldRecord = {
      id: "old-001",
      name: "Old Location",
      city: "Sevilla",
      province: "Sevilla",
      country: "Spain",
      latitude: 37.38,
      longitude: -5.99,
      status: "potential",
      assetType: "retail",
      priority: "low",
      createdAt: "2025-01-01T00:00:00.000Z",
      updatedAt: "2025-01-01T00:00:00.000Z"
    };
    const result = parseLocationsImport([oldRecord]);
    expect(result).not.toBeNull();
    expect(result![0].status).toBe("interested");
    expect(result![0].contactName).toBeUndefined();
    expect(result![0].probability).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// 3. CSV roundtrip
// ---------------------------------------------------------------------------

describe("CSV roundtrip", () => {
  it("exports and re-imports a location with all new fields", () => {
    const original = makeLocation({
      askingPrice: 800000,
      targetPrice: 720000,
      monthlyRent: 3500,
      expectedCapex: 50000,
      probability: 55,
      interestLevel: "high",
      controlType: "negotiation",
      nextAction: "Sign heads of terms",
      nextActionDate: "2026-07-01",
      contactName: "Pedro Lopez",
      contactRole: "Owner",
      contactPhone: "+34 600 999 888",
      contactEmail: "pedro@example.com",
      lastContactedAt: "2026-06-01",
      decisionReason: "Strong location"
    });

    const csv = exportLocationsToCsv([original]);
    const reimported = parseLocationsCsv(csv);

    expect(reimported).not.toBeNull();
    expect(reimported!).toHaveLength(1);
    const loc = reimported![0];
    expect(loc.askingPrice).toBe(800000);
    expect(loc.targetPrice).toBe(720000);
    expect(loc.monthlyRent).toBe(3500);
    expect(loc.expectedCapex).toBe(50000);
    expect(loc.probability).toBe(55);
    expect(loc.interestLevel).toBe("high");
    expect(loc.controlType).toBe("negotiation");
    expect(loc.nextAction).toBe("Sign heads of terms");
    expect(loc.nextActionDate).toBe("2026-07-01");
    expect(loc.contactName).toBe("Pedro Lopez");
    expect(loc.contactRole).toBe("Owner");
    expect(loc.decisionReason).toBe("Strong location");
  });

  it("exports new columns in the CSV header", () => {
    const csv = exportLocationsToCsv([makeLocation()]);
    const header = csv.split("\r\n")[0].split(",");
    for (const col of ["askingPrice", "targetPrice", "probability", "contactName", "nextAction"]) {
      expect(header).toContain(col);
    }
  });

  it("old CSV (without new columns) still imports via legacy status migration", () => {
    const oldCsv = [
      "id,name,address,city,province,autonomousCommunity,country,latitude,longitude,googleMapsUrl,status,assetType,priority,estimatedValue,surfaceAreaM2,source,owner,notes,createdAt,updatedAt",
      "old-001,Old Spot,,Madrid,Madrid,,Spain,40.4168,-3.7038,,potential,retail,medium,,,,,2025-01-01T00:00:00.000Z,2025-01-01T00:00:00.000Z"
    ].join("\r\n");

    const result = parseLocationsCsv(oldCsv);
    expect(result).not.toBeNull();
    expect(result![0].status).toBe("interested");
    expect(result![0].askingPrice).toBeUndefined();
  });

  it("roundtrips optional fields as undefined when empty", () => {
    const loc = makeLocation();
    const csv = exportLocationsToCsv([loc]);
    const reimported = parseLocationsCsv(csv);
    expect(reimported).not.toBeNull();
    expect(reimported![0].askingPrice).toBeUndefined();
    expect(reimported![0].contactName).toBeUndefined();
    expect(reimported![0].probability).toBeUndefined();
  });

  it("handles commas and quotes in notes field", () => {
    const loc = makeLocation({ notes: 'Has "good" access, prime location' });
    const csv = exportLocationsToCsv([loc]);
    const reimported = parseLocationsCsv(csv);
    expect(reimported![0].notes).toBe('Has "good" access, prime location');
  });
});

// ---------------------------------------------------------------------------
// 4. Data health / needs-attention calculation
// ---------------------------------------------------------------------------

describe("needsAttentionCount", () => {
  it("counts active record with overdue nextActionDate", () => {
    const loc = makeLocation({ nextActionDate: "2020-01-01", nextAction: "Do something" });
    expect(needsAttentionCount([loc])).toBe(1);
  });

  it("counts active record with missing nextAction", () => {
    const loc = makeLocation({ nextAction: undefined });
    expect(needsAttentionCount([loc])).toBe(1);
  });

  it("counts negotiating record missing contactName", () => {
    const loc = makeLocation({ status: "negotiating", nextAction: "Follow up", contactName: undefined });
    expect(needsAttentionCount([loc])).toBe(1);
  });

  it("does not double-count a record matching multiple conditions", () => {
    const loc = makeLocation({
      status: "negotiating",
      nextAction: undefined,
      contactName: undefined
    });
    expect(needsAttentionCount([loc])).toBe(1);
  });

  it("does not count archived records", () => {
    const loc = makeLocation({ status: "archived", nextAction: undefined });
    expect(needsAttentionCount([loc])).toBe(0);
  });

  it("does not count a location with future nextActionDate and present contact", () => {
    const loc = makeLocation({
      nextAction: "Site visit",
      nextActionDate: "2099-01-01"
    });
    expect(needsAttentionCount([loc])).toBe(0);
  });

  it("is surfaced in getDataHealth", () => {
    const overdueLoc = makeLocation({ nextActionDate: "2020-01-01", nextAction: "x" });
    const health = getDataHealth([overdueLoc]);
    expect(health.needsAttention).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// 5. Google Maps coordinate extraction
// ---------------------------------------------------------------------------

describe("extractCoordinatesFromGoogleMapsUrl", () => {
  it("extracts from @lat,lng format", () => {
    const result = extractCoordinatesFromGoogleMapsUrl(
      "https://www.google.com/maps/@40.4195,-3.7041,15z"
    );
    expect(result).not.toBeNull();
    expect(result!.latitude).toBeCloseTo(40.4195);
    expect(result!.longitude).toBeCloseTo(-3.7041);
  });

  it("extracts from ?q=lat,lng format", () => {
    const result = extractCoordinatesFromGoogleMapsUrl(
      "https://www.google.com/maps?q=41.3917,2.1649"
    );
    expect(result).not.toBeNull();
    expect(result!.latitude).toBeCloseTo(41.3917);
    expect(result!.longitude).toBeCloseTo(2.1649);
  });

  it("extracts from ?ll=lat,lng format", () => {
    const result = extractCoordinatesFromGoogleMapsUrl(
      "https://maps.google.com/?ll=39.4621,-0.3748"
    );
    expect(result).not.toBeNull();
    expect(result!.latitude).toBeCloseTo(39.4621);
    expect(result!.longitude).toBeCloseTo(-0.3748);
  });

  it("returns null for a URL with no coordinates", () => {
    expect(extractCoordinatesFromGoogleMapsUrl("https://www.google.com/maps")).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(extractCoordinatesFromGoogleMapsUrl("")).toBeNull();
  });

  it("returns null for coordinates outside valid range", () => {
    const result = extractCoordinatesFromGoogleMapsUrl(
      "https://www.google.com/maps/@99.0000,-200.0000,15z"
    );
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 6. isRealEstateLocation validator for new fields
// ---------------------------------------------------------------------------

describe("isRealEstateLocation", () => {
  it("accepts a valid record with all new optional fields", () => {
    const loc = makeLocation({
      interestLevel: "high",
      controlType: "leased",
      askingPrice: 100000,
      probability: 50
    });
    expect(isRealEstateLocation(loc)).toBe(true);
  });

  it("rejects invalid interestLevel value", () => {
    const loc = { ...makeLocation(), interestLevel: "extreme" };
    expect(isRealEstateLocation(loc)).toBe(false);
  });

  it("rejects invalid controlType value", () => {
    const loc = { ...makeLocation(), controlType: "rented" };
    expect(isRealEstateLocation(loc)).toBe(false);
  });

  it("rejects non-finite probability", () => {
    const loc = { ...makeLocation(), probability: Infinity };
    expect(isRealEstateLocation(loc)).toBe(false);
  });

  it("accepts all csvColumns as known keys", () => {
    const loc = makeLocation();
    for (const col of csvColumns) {
      expect(col in loc || loc[col as keyof typeof loc] === undefined).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// 7. Date-only overdue comparison edge cases
// ---------------------------------------------------------------------------

describe("needsAttentionCount date edge cases", () => {
  it("due today is not overdue", () => {
    const today = new Date().toISOString().slice(0, 10);
    const loc = makeLocation({ nextActionDate: today, nextAction: "Something" });
    expect(needsAttentionCount([loc])).toBe(0);
  });

  it("yesterday is overdue", () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const loc = makeLocation({ nextActionDate: yesterday, nextAction: "Something" });
    expect(needsAttentionCount([loc])).toBe(1);
  });

  it("tomorrow is not overdue", () => {
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const loc = makeLocation({ nextActionDate: tomorrow, nextAction: "Something" });
    expect(needsAttentionCount([loc])).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 8. Import validation — negative business numbers and probability range
// ---------------------------------------------------------------------------

describe("import validation — negative numbers and probability", () => {
  it("rejects imported record with negative askingPrice", () => {
    const loc = { ...makeLocation(), askingPrice: -1000 };
    expect(parseLocationsImport([loc])).toBeNull();
  });

  it("rejects imported record with negative monthlyRent", () => {
    const loc = { ...makeLocation(), monthlyRent: -500 };
    expect(parseLocationsImport([loc])).toBeNull();
  });

  it("accepts askingPrice of 0", () => {
    const loc = makeLocation({ askingPrice: 0 });
    expect(parseLocationsImport([loc])).not.toBeNull();
  });

  it("rejects probability above 100", () => {
    const loc = { ...makeLocation(), probability: 101 };
    expect(parseLocationsImport([loc])).toBeNull();
  });

  it("rejects probability below 0", () => {
    const loc = { ...makeLocation(), probability: -1 };
    expect(parseLocationsImport([loc])).toBeNull();
  });

  it("accepts probability of 0 and 100", () => {
    expect(parseLocationsImport([makeLocation({ probability: 0 })])).not.toBeNull();
    expect(parseLocationsImport([makeLocation({ probability: 100 })])).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 9. Zero-value formatting
// ---------------------------------------------------------------------------

describe("zero-value formatting", () => {
  it("formatCurrency(0) returns a real currency value", () => {
    const result = formatCurrency(0);
    expect(result).not.toBe("Not estimated");
    expect(result).toContain("0");
  });

  it("formatArea(0) returns a real area value", () => {
    const result = formatArea(0);
    expect(result).not.toBe("Not recorded");
    expect(result).toContain("0");
  });

  it("formatCurrency(undefined) returns 'Not estimated'", () => {
    expect(formatCurrency(undefined)).toBe("Not estimated");
  });

  it("formatArea(undefined) returns 'Not recorded'", () => {
    expect(formatArea(undefined)).toBe("Not recorded");
  });
});

// ---------------------------------------------------------------------------
// 10. getAttentionItems helper
// ---------------------------------------------------------------------------

describe("getAttentionItems", () => {
  it("returns overdue item when nextActionDate is in the past", () => {
    const loc = makeLocation({ nextActionDate: "2020-01-01", nextAction: "Do something" });
    const items = getAttentionItems([loc]);
    expect(items).toHaveLength(1);
    expect(items[0].reasons).toContain("overdue");
  });

  it("returns missingAction when nextAction is empty", () => {
    const loc = makeLocation({ nextAction: undefined });
    const items = getAttentionItems([loc]);
    expect(items[0].reasons).toContain("missingAction");
  });

  it("returns negotiatingNoContact for negotiating without contactName", () => {
    const loc = makeLocation({ status: "negotiating", nextAction: "Follow up", contactName: undefined });
    const items = getAttentionItems([loc]);
    expect(items[0].reasons).toContain("negotiatingNoContact");
  });

  it("does not include archived locations", () => {
    const loc = makeLocation({ status: "archived", nextAction: undefined });
    expect(getAttentionItems([loc])).toHaveLength(0);
  });

  it("can return multiple reasons for a single location", () => {
    const loc = makeLocation({
      status: "negotiating",
      nextActionDate: "2020-01-01",
      nextAction: undefined,
      contactName: undefined
    });
    const items = getAttentionItems([loc]);
    expect(items[0].reasons.length).toBeGreaterThan(1);
  });

  it("returns empty array when all locations are healthy", () => {
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const loc = makeLocation({
      status: "negotiating",
      nextAction: "Call",
      nextActionDate: tomorrow,
      contactName: "Maria"
    });
    expect(getAttentionItems([loc])).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 11. sortLocations table helper
// ---------------------------------------------------------------------------

describe("sortLocations", () => {
  it("sorts by estimatedValue ascending, undefined last", () => {
    const locs = [
      makeLocation({ id: "a", estimatedValue: 500000 }),
      makeLocation({ id: "b", estimatedValue: 100000 }),
      makeLocation({ id: "c", estimatedValue: undefined })
    ];
    const sorted = sortLocations(locs, "estimatedValue", "asc");
    expect(sorted[0].id).toBe("b");
    expect(sorted[1].id).toBe("a");
    expect(sorted[2].id).toBe("c");
  });

  it("sorts by priority ascending (high first)", () => {
    const locs = [
      makeLocation({ id: "lo", priority: "low" }),
      makeLocation({ id: "hi", priority: "high" }),
      makeLocation({ id: "me", priority: "medium" })
    ];
    const sorted = sortLocations(locs, "priority", "asc");
    expect(sorted[0].id).toBe("hi");
    expect(sorted[1].id).toBe("me");
    expect(sorted[2].id).toBe("lo");
  });

  it("sorts by nextActionDate ascending, undefined last", () => {
    const locs = [
      makeLocation({ id: "future", nextActionDate: "2099-01-01" }),
      makeLocation({ id: "past", nextActionDate: "2020-01-01" }),
      makeLocation({ id: "none", nextActionDate: undefined })
    ];
    const sorted = sortLocations(locs, "nextActionDate", "asc");
    expect(sorted[0].id).toBe("past");
    expect(sorted[1].id).toBe("future");
    expect(sorted[2].id).toBe("none");
  });

  it("reverses order with desc direction", () => {
    const locs = [
      makeLocation({ id: "a", estimatedValue: 100000 }),
      makeLocation({ id: "b", estimatedValue: 500000 })
    ];
    const asc = sortLocations(locs, "estimatedValue", "asc");
    const desc = sortLocations(locs, "estimatedValue", "desc");
    expect(asc[0].id).toBe("a");
    expect(desc[0].id).toBe("b");
  });
});

// ---------------------------------------------------------------------------
// 12. groupByPipelineStatus pipeline helper
// ---------------------------------------------------------------------------

describe("groupByPipelineStatus", () => {
  it("groups locations by their status", () => {
    const locs = [
      makeLocation({ id: "n1", status: "negotiating" }),
      makeLocation({ id: "i1", status: "interested" }),
      makeLocation({ id: "i2", status: "interested" })
    ];
    const groups = groupByPipelineStatus(locs);
    expect(groups.negotiating).toHaveLength(1);
    expect(groups.interested).toHaveLength(2);
    expect(groups.watchlist).toHaveLength(0);
    expect(groups.evaluating).toHaveLength(0);
  });

  it("ignores archived locations (not in pipeline columns)", () => {
    const locs = [makeLocation({ id: "arch", status: "archived" })];
    const groups = groupByPipelineStatus(locs);
    // archived has no pipeline column — should not appear in any group
    const allGrouped = Object.values(groups).flat();
    expect(allGrouped).toHaveLength(0);
  });
});
