
export const locate = async (orn: string) => {
  return {orn};
};

export const locateAll = (orn: string[]) => {
  return Promise.all(orn.map(locate));
};

export default {locate, locateAll};
