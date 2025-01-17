const STORAGE_KEY = 'identityManager';

export const getLocalData = () => {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { identities: [] };
};

export const saveLocalData = (data) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const addIdentity = (identity) => {
  const data = getLocalData();
  data.identities.push({ ...identity, claims: [] });
  saveLocalData(data);
};

export const addClaimToIdentity = (identityId, claim) => {
  const data = getLocalData();
  const identity = data.identities.find((id) => id.id === identityId);
  if (identity) {
    identity.claims.push(claim);
    saveLocalData(data);
  }
};

export const getIdentityById = (id) => {
  const data = getLocalData();
  return data.identities.find((identity) => identity.id === id) || null;
};
