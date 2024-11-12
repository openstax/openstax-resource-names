
const ancillariesHost = process.env.ANCILLARIES_HOST || process.env.REACT_APP_ANCILLARIES_HOST || 'https://ancillaries.openstax.org/';

export const ancillary = async(id: string) => {
  const data = await fetch(`${ancillariesHost}api/v0/ancillaries/${id}/compiled`)
    .then(response => response.json());
 
  return formatAncillaryData(data);
};

export const search = async(query: string, _limit: number) => {
  const results = await fetch(`${ancillariesHost}api/v0/ancillaries?query=${encodeURIComponent(query)}&publicationState=published`)
    .then(response => response.json());

  return results.items.map(formatAncillaryData);
};


function formatAncillaryData(data: any) {
  return {
    id: data.id,
    orn: `https://openstax.org/orn/ancillary/${data.id}`,
    type: 'ancillary' as const,
    title: data.name,
    description: data.description,
    ancillaryType: {
      ...data.type,
      ...('icon' in data.type ? {icon: {url: ancillariesHost + data.type.icon.url}}: {})
    },
    urls: {
      main: ancillariesHost + data.defaultFormat.latestUrl
    },
  };
}
