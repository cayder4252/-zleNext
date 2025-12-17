
const API_KEY = 'ldDCNifAdxxUu7UMXMXhWo1AUNHsP0QLnxrUnmzI';
const BASE_URL = 'https://api.watchmode.com/v1';

export interface StreamingSource {
    source_id: number;
    name: string;
    type: string;
    region: string;
    ios_url?: string;
    android_url?: string;
    web_url?: string;
    format?: string;
    price?: number | null;
    seasons?: number;
    episodes?: number;
}

export const watchmode = {
    getStreamingSources: async (imdbId: string): Promise<StreamingSource[]> => {
        try {
            // 1. Get Watchmode ID from IMDb ID
            const searchRes = await fetch(`${BASE_URL}/search/?apiKey=${API_KEY}&search_field=imdb_id&search_value=${imdbId}`);
            const searchData = await searchRes.json();

            if (!searchData.title_results || searchData.title_results.length === 0) {
                return [];
            }

            const titleId = searchData.title_results[0].id;

            // 2. Get Sources for the title
            const sourcesRes = await fetch(`${BASE_URL}/title/${titleId}/sources/?apiKey=${API_KEY}&regions=US`);
            const sourcesData = await sourcesRes.json();

            if (!Array.isArray(sourcesData)) return [];

            // Filter duplicates and 'sub' (subscription) type
            const uniqueSources = new Map();
            sourcesData.forEach((source: any) => {
                if (source.type === 'sub') {
                    if (!uniqueSources.has(source.name)) {
                        uniqueSources.set(source.name, source);
                    }
                }
            });

            return Array.from(uniqueSources.values());
        } catch (error) {
            console.error("Watchmode fetch error:", error);
            return [];
        }
    }
};
