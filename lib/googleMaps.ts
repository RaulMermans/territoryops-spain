const COORDINATE_PAIR =
  /([-+]?(?:[1-8]?\d(?:\.\d+)?|90(?:\.0+)?)),\s*([-+]?(?:1[0-7]\d(?:\.\d+)?|[1-9]?\d(?:\.\d+)?|180(?:\.0+)?))/;

function normalizeCoordinatePair(latitude: number, longitude: number) {
  if (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  ) {
    return { latitude, longitude };
  }

  return null;
}

export function extractCoordinatesFromGoogleMapsUrl(
  url: string
): { latitude: number; longitude: number } | null {
  const trimmedUrl = url.trim();

  if (!trimmedUrl) {
    return null;
  }

  let decodedUrl = trimmedUrl;

  try {
    decodedUrl = decodeURIComponent(trimmedUrl);
  } catch {
    decodedUrl = trimmedUrl;
  }
  const atMatch = decodedUrl.match(/@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/);

  if (atMatch) {
    return normalizeCoordinatePair(Number(atMatch[1]), Number(atMatch[2]));
  }

  try {
    const parsedUrl = new URL(trimmedUrl);
    const searchParams = parsedUrl.searchParams;

    for (const key of ["q", "ll", "query"]) {
      const value = searchParams.get(key);
      const match = value?.match(COORDINATE_PAIR);

      if (match) {
        return normalizeCoordinatePair(Number(match[1]), Number(match[2]));
      }
    }
  } catch {
    const fallbackMatch = decodedUrl.match(
      /(?:[?&](?:q|ll|query)=)([-+]?\d+(?:\.\d+)?),\s*([-+]?\d+(?:\.\d+)?)/
    );

    if (fallbackMatch) {
      return normalizeCoordinatePair(
        Number(fallbackMatch[1]),
        Number(fallbackMatch[2])
      );
    }
  }

  const looseMatch = decodedUrl.match(COORDINATE_PAIR);
  if (looseMatch) {
    return normalizeCoordinatePair(Number(looseMatch[1]), Number(looseMatch[2]));
  }

  return null;
}
