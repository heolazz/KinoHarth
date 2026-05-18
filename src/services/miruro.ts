type MiruroEpisodeItem = {
  id?: string;
  slug?: string;
  number?: number;
  episode?: number;
  title?: string;
  image?: string | null;
  img?: string | null;
  thumbnail?: string | null;
  category?: string;
  provider?: string;
};

type MiruroProviderData = {
  episodes?: {
    sub?: MiruroEpisodeItem[];
    dub?: MiruroEpisodeItem[];
    raw?: MiruroEpisodeItem[];
  };
};

type MiruroEpisodesResponse = {
  success?: boolean;
  data?: {
    mappings?: {
      aniId?: number;
      malId?: number;
      title?: string;
      themoviedbId?: number;
      tmdbSeason?: string | number;
      defaultTvdbSeason?: string | number;
    };
    providers?: Record<string, MiruroProviderData>;
  };
};

export type MiruroEpisodeMetadata = {
  number: number;
  title?: string;
  image?: string | null;
  provider: string;
  category: string;
};

export type MiruroAnimeEpisodeMetadata = {
  tmdbId?: number;
  tmdbSeason?: number;
  episodes: MiruroEpisodeMetadata[];
};

function getEpisodeNumber(episode: MiruroEpisodeItem) {
  const number = Number(episode.number ?? episode.episode);

  return Number.isInteger(number) && number > 0 ? number : null;
}

function getEpisodeImage(episode: MiruroEpisodeItem) {
  return episode.image || episode.thumbnail || episode.img || null;
}

function getSeasonNumber(value: string | number | undefined) {
  const number = Number(value);

  return Number.isInteger(number) && number > 0 ? number : undefined;
}

function getCategoryRank(category: string) {
  const preferred = ["sub", "dub", "raw"];
  const rank = preferred.indexOf(category);

  return rank === -1 ? preferred.length : rank;
}

function getProviderRank(provider: string) {
  const preferred = [
    "bee",
    "ally",
    "kiwi",
    "dune",
    "animekai",
    "hop",
    "zoro",
    "allanime",
  ];
  const rank = preferred.indexOf(provider.toLowerCase());

  return rank === -1 ? preferred.length : rank;
}

function getMiruroEpisodes(json: MiruroEpisodesResponse) {
  const episodes: MiruroEpisodeMetadata[] = [];
  const providers = json.data?.providers || {};

  for (const provider of Object.keys(providers)) {
    const groups = providers[provider]?.episodes;

    for (const category of ["sub", "dub", "raw"] as const) {
      const items = groups?.[category] || [];

      episodes.push(
        ...items.flatMap((item) => {
          const number = getEpisodeNumber(item);

          if (!number) {
            return [];
          }

          return [
            {
              number,
              title: item.title,
              image: getEpisodeImage(item),
              provider,
              category,
            },
          ];
        })
      );
    }
  }

  return episodes
    .sort((a, b) => {
      const categoryDiff = getCategoryRank(a.category) - getCategoryRank(b.category);

      if (categoryDiff !== 0) {
        return categoryDiff;
      }

      return getProviderRank(a.provider) - getProviderRank(b.provider);
    })
    .reduce<MiruroEpisodeMetadata[]>((uniqueEpisodes, episode) => {
      if (!uniqueEpisodes.some((item) => item.number === episode.number)) {
        uniqueEpisodes.push(episode);
      }

      return uniqueEpisodes;
    }, [])
    .sort((a, b) => a.number - b.number);
}

export async function getMiruroAnimeEpisodeMetadata(
  animeId: number
): Promise<MiruroAnimeEpisodeMetadata | null> {
  const baseUrl = process.env.MIRURO_API_BASE_URL;

  if (!baseUrl) {
    return null;
  }

  try {
    const endpoint = new URL(`/api/v2/miruro/episodes/${animeId}`, baseUrl);
    const response = await fetch(endpoint, {
      headers: {
        Accept: "application/json",
      },
      next: {
        revalidate: 60 * 60 * 6,
      },
    });

    if (!response.ok) {
      return null;
    }

    const json = (await response.json()) as MiruroEpisodesResponse;
    const mappings = json.data?.mappings;
    const tmdbSeason =
      getSeasonNumber(mappings?.tmdbSeason) ||
      getSeasonNumber(mappings?.defaultTvdbSeason);

    return {
      tmdbId: mappings?.themoviedbId,
      tmdbSeason,
      episodes: getMiruroEpisodes(json),
    };
  } catch {
    return null;
  }
}
