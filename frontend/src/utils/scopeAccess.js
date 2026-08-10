export const parseScopeList = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string' && raw.startsWith('[')) {
    try {
      return JSON.parse(raw);
    } catch (e) {
      return [];
    }
  }
  return typeof raw === 'string'
    ? raw.split(',').map(item => item.trim()).filter(Boolean)
    : [];
};

const getSiteArea = (site) => site.area ?? site.rawArea ?? '';
const getSiteSubarea = (site) => site.subarea ?? site.rawSubarea ?? '';

export const canAccessSiteByScope = (site, allSites, user) => {
  if (user?.role === 'Admin') return true;

  const userAreas = parseScopeList(user?.area);
  const userSubareas = parseScopeList(user?.subarea);
  const hasUserAreas = userAreas.length > 0 && !userAreas.includes('All');
  const hasUserSubareas = userSubareas.length > 0 && !userSubareas.includes('All');

  if (!hasUserAreas && !hasUserSubareas) return true;

  const siteArea = getSiteArea(site);
  const siteSubarea = getSiteSubarea(site);

  if (hasUserAreas) {
    if (!userAreas.includes(siteArea)) return false;
    if (!hasUserSubareas) return true;

    const subareasInThisArea = allSites
      .filter(candidate => getSiteArea(candidate) === siteArea)
      .map(getSiteSubarea)
      .filter(Boolean);

    const hasMatchingSubareaForThisArea = subareasInThisArea.some(subarea => userSubareas.includes(subarea));

    return hasMatchingSubareaForThisArea
      ? userSubareas.includes(siteSubarea)
      : true;
  }

  if (hasUserSubareas) {
    return userSubareas.includes(siteSubarea) || userSubareas.includes(siteArea);
  }

  return true;
};

export const filterSitesByUserScope = (sites, user) => {
  return sites.filter(site => canAccessSiteByScope(site, sites, user));
};
