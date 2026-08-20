export default new class OpenSubtitlesES {

    async test() {
        return true
    }

    async single(query, options) {
        const { imdbId, episode, titles } = query
        const apiFetch = (typeof query.fetch === 'function') ? query.fetch : fetch

        console.log('[ES] single() llamado — episode:', episode, 'imdbId:', imdbId, 'titles:', titles?.[0])
        console.log('[ES] options recibidos:', JSON.stringify(options))

        const apiKey = options?.apiKey
        if (!apiKey) throw new Error('Se requiere una API Key de OpenSubtitles. Configúrala en los ajustes de la extensión.')

        const headers = {
            'Api-Key': apiKey,
            'User-Agent': 'HayaseSubsES v1.0.0',
            'Content-Type': 'application/json'
        }

        // Construir parámetros de búsqueda
        const params = new URLSearchParams({
            languages: 'es',
            order_by: 'download_count',
            order_direction: 'desc'
        })

        if (episode != null) params.set('episode_number', String(episode))

        if (imdbId) {
            params.set('imdb_id', String(imdbId).replace(/^tt0*/, ''))
        } else if (titles?.length) {
            params.set('query', titles[0])
        } else {
            console.log('[ES] Sin imdbId ni títulos, devolviendo []')
            return []
        }

        const searchUrl = `https://api.opensubtitles.com/api/v1/subtitles?${params.toString()}`
        console.log('[ES] Buscando en:', searchUrl)

        // Paso 1: Buscar subtítulos
        let subtitles
        try {
            const searchRes = await apiFetch(searchUrl, { headers })
            console.log('[ES] Respuesta búsqueda HTTP:', searchRes.status)
            if (!searchRes.ok) throw new Error(`HTTP ${searchRes.status}`)
            const searchData = await searchRes.json()
            subtitles = searchData?.data ?? []
            console.log('[ES] Subtítulos encontrados:', subtitles.length)
        } catch (e) {
            console.log('[ES] ERROR en búsqueda:', e.message)
            throw new Error(`Error buscando en OpenSubtitles: ${e.message}`)
        }

        if (!subtitles.length) {
            console.log('[ES] Sin resultados para este episodio')
            return []
        }

        // Paso 2: Obtener enlaces de descarga
        const results = []

        for (const sub of subtitles.slice(0, 5)) {
            const fileId = sub?.attributes?.files?.[0]?.file_id
            console.log('[ES] Procesando fileId:', fileId)
            if (!fileId) continue

            try {
                const dlRes = await apiFetch('https://api.opensubtitles.com/api/v1/download', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ file_id: fileId })
                })
                console.log('[ES] Respuesta descarga HTTP:', dlRes.status)
                if (!dlRes.ok) {
                    const txt = await dlRes.text()
                    console.log('[ES] Error descarga body:', txt)
                    continue
                }
                const dlData = await dlRes.json()
                console.log('[ES] Link obtenido:', dlData?.link?.slice(0, 60))
                if (!dlData?.link) continue
                results.push({ url: dlData.link, language: 'ES' })
            } catch (e) {
                console.log('[ES] ERROR en descarga fileId', fileId, ':', e.message)
            }
        }

        console.log('[ES] Resultados finales:', results.length)
        return results
    }
}
