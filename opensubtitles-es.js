export default new class OpenSubtitlesES {

    // Verifica que el servidor de OpenSubtitles es accesible
    // Nota: test() no recibe options en Hayase, por eso solo comprobamos conectividad
    async test() {
        const res = await fetch('https://www.opensubtitles.com')
        if (!res.ok) throw new Error('OpenSubtitles no está disponible en este momento.')
        return true
    }

    // Busca subtítulos en español para un episodio concreto
    async single(query, options) {
        const { anilistId, imdbId, episode, titles } = query
        // Usar query.fetch si existe (CORS-enabled), si no el fetch global
        const apiFetch = (typeof query.fetch === 'function') ? query.fetch : fetch

        const apiKey = options?.apiKey
        if (!apiKey) throw new Error('Se requiere una API Key de OpenSubtitles. Configúrala en los ajustes de la extensión.')

        const headers = {
            'Api-Key': apiKey,
            'User-Agent': 'HayaseSubsES v1.0.0',
            'Content-Type': 'application/json'
        }

        // Construir los parámetros de búsqueda
        const params = new URLSearchParams({
            languages: 'es',
            order_by: 'download_count',
            order_direction: 'desc'
        })

        if (episode != null) params.set('episode_number', String(episode))

        if (imdbId) {
            // OpenSubtitles espera el ID sin "tt" y sin ceros iniciales
            params.set('imdb_id', String(imdbId).replace(/^tt0*/, ''))
        } else if (titles?.length) {
            params.set('query', titles[0])
        } else {
            return []
        }

        // Paso 1: Buscar subtítulos disponibles
        let subtitles
        try {
            const searchRes = await apiFetch(
                `https://api.opensubtitles.com/api/v1/subtitles?${params.toString()}`,
                { headers }
            )
            if (!searchRes.ok) throw new Error(`HTTP ${searchRes.status}`)
            const searchData = await searchRes.json()
            subtitles = searchData?.data ?? []
        } catch (e) {
            throw new Error(`Error buscando en OpenSubtitles: ${e.message}`)
        }

        if (!subtitles.length) return []

        // Paso 2: Obtener los enlaces de descarga para los primeros resultados
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

                results.push({
                    url: dlData.link,
                    language: 'ES'
                })
            } catch {
                // Si falla un enlace individual, continuar con el siguiente
            }
        }

        return results
    }
}
