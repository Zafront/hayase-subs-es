export default new class extends SubtitleSource {

    // Verifica que la API de OpenSubtitles esté accesible
    async test() {
        const res = await fetch('https://api.opensubtitles.com/api/v1')
        return res.ok
    }

    // Busca subtítulos en español para un episodio concreto
    async single({ anilistId, imdbId, episode, titles, fetch }, options) {
        const apiKey = options?.apiKey
        if (!apiKey) throw new Error('Se requiere una API Key de OpenSubtitles. Configúrala en los ajustes de la extensión.')

        const headers = {
            'Api-Key': apiKey,
            'User-Agent': 'HayaseSubsES v1.0.0',
            'Content-Type': 'application/json'
        }

        // Construir los parámetros de búsqueda
        // Preferimos imdbId por su precisión, si no usamos el título principal
        const params = new URLSearchParams({
            languages: 'es',
            episode_number: episode,
            order_by: 'download_count',
            order_direction: 'desc'
        })

        if (imdbId) {
            // OpenSubtitles espera el ID sin el prefijo "tt" y sin ceros a la izquierda
            params.set('imdb_id', imdbId.replace(/^tt0*/, ''))
        } else if (titles?.length) {
            params.set('query', titles[0])
        } else {
            return []
        }

        // Paso 1: Buscar subtítulos disponibles
        const searchRes = await fetch(
            `https://api.opensubtitles.com/api/v1/subtitles?${params.toString()}`,
            { headers }
        )

        if (!searchRes.ok) {
            throw new Error(`OpenSubtitles devolvió un error al buscar: ${searchRes.status}`)
        }

        const searchData = await searchRes.json()
        const subtitles = searchData?.data

        if (!subtitles?.length) return []

        // Paso 2: Obtener los enlaces de descarga para los primeros resultados
        const results = []

        for (const sub of subtitles.slice(0, 5)) {
            const fileId = sub?.attributes?.files?.[0]?.file_id
            if (!fileId) continue

            try {
                const dlRes = await fetch('https://api.opensubtitles.com/api/v1/download', {
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
                // Si falla un enlace concreto, continuamos con el siguiente
            }
        }

        return results
    }
}
