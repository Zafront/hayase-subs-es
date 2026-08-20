export default new class OpenSubtitlesES {

    async test() {
        return true
    }

    async single(query, options) {
        const { imdbId, episode, titles } = query
        const apiFetch = (typeof query.fetch === 'function') ? query.fetch : fetch

        const apiKey = options?.apiKey
        if (!apiKey) throw new Error('Se requiere una API Key de OpenSubtitles. Configúrala en los ajustes de la extensión.')

        const headers = {
            'Api-Key': apiKey,
            'User-Agent': 'HayaseSubsES v1.0.0',
            'Content-Type': 'application/json'
        }

        // Intentamos primero con imdbId (más preciso), luego con título (más amplio)
        const searches = []
        if (imdbId) {
            const p = new URLSearchParams({ languages: 'es', order_by: 'download_count', order_direction: 'desc' })
            p.set('imdb_id', String(imdbId).replace(/^tt0*/, ''))
            if (episode != null) p.set('episode_number', String(episode))
            searches.push(p)
        }
        if (titles?.length) {
            const p = new URLSearchParams({ languages: 'es', order_by: 'download_count', order_direction: 'desc' })
            p.set('query', titles[0])
            if (episode != null) p.set('episode_number', String(episode))
            searches.push(p)
        }
        if (!searches.length) return []

        // Probar cada estrategia de búsqueda hasta obtener resultados
        let subtitles = []
        for (const params of searches) {
            try {
                const searchRes = await apiFetch(
                    `https://api.opensubtitles.com/api/v1/subtitles?${params.toString()}`,
                    { headers }
                )
                if (!searchRes.ok) continue
                const searchData = await searchRes.json()
                subtitles = searchData?.data ?? []
                if (subtitles.length) break  // con resultados, no hace falta seguir buscando
            } catch {
                continue
            }
        }

        if (!subtitles.length) return []

        // Obtener los enlaces de descarga para los primeros resultados
        const results = []
        for (const sub of subtitles.slice(0, 5)) {
            const fileId = sub?.attributes?.files?.[0]?.file_id
            if (!fileId) continue
            try {
                const dlRes = await apiFetch('https://api.opensubtitles.com/api/v1/download', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ file_id: fileId })
                })
                if (!dlRes.ok) continue
                const dlData = await dlRes.json()
                if (!dlData?.link) continue
                results.push({ url: dlData.link, language: 'ES' })
            } catch {
                // Si falla un enlace individual, continuar con el siguiente
            }
        }

        return results
    }
}
