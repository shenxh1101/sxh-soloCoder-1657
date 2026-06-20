export function stringifyQuery(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    if (Array.isArray(value)) {
      if (value.length > 0) {
        searchParams.append(key, value.join(','));
      }
    } else if (typeof value === 'boolean') {
      searchParams.append(key, value ? 'true' : 'false');
    } else {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

function tryParseValue(value: string): any {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null') return null;
  if (value === 'undefined') return undefined;

  if (/^\d+$/.test(value)) {
    return parseInt(value, 10);
  }

  if (/^\d+\.\d+$/.test(value)) {
    return parseFloat(value);
  }

  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (datePattern.test(value)) {
    return value;
  }

  const dateTimePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
  if (dateTimePattern.test(value)) {
    return value;
  }

  if (value.includes(',')) {
    const parts = value.split(',');
    return parts.map(part => tryParseValue(part.trim()));
  }

  return value;
}

export function parseQuery(search: string): Record<string, any> {
  const result: Record<string, any> = {};
  const searchParams = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);

  searchParams.forEach((value, key) => {
    result[key] = tryParseValue(value);
  });

  return result;
}

export function buildUrl(path: string, params: Record<string, any>): string {
  const queryString = stringifyQuery(params);
  if (!queryString) {
    return path;
  }
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}${queryString.slice(1)}`;
}
