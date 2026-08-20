export default new class extends SubtitleSource {

    // Verifica que la API de OpenSubtitles esté accesible
    async test() {
        const res = await fetch('https://api.opensubtitles.com/api/v1')
        return res.ok
    }

    // Busca subtítulos en español para un episodio concreto
    async single(query, options) {
        const { anilistId, imdbId, episode, titles } = query
        // Importante: usar query.fetch (CORS-enabled) para llamadas a la API externa
        const apiFetch = query.fetch ?? fetch

        const apiKey = options?.apiKey
        if (!apiKey) throw new Error('Se requiere una API Key de OpenSubtitles. Configúrala en los ajustes de la extensión.')

        const headers = {
            'Api-Key': apiKey,
            'User-Agent': 'HayaseSubsES v1.0.0',
            'Content-Type': 'application/json'
        }

        // Autenticación opcional: si el usuario dio credenciales, obtenemos un JWT
        // para superar el límite de 5 descargas anónimas por día
        let authHeader = {}
        const username = options?.username
        const password = options?.password
        if (username && password) {
            try {
                const loginRes = await apiFetch('https://api.opensubtitles.com/api/v1/login', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ username, password })
                })
                if (loginRes.ok) {
                    const loginData = await loginRes.json()
                    if (loginData?.token) {
                        authHeader = { 'Authorization': `Bearer ${loginData.token}` }
                    }
                }
            } catch {
                // Si falla el login, continuamos sin autenticación (límite bajo)
            }
        }

        const headersWithAuth = { ...headers, ...authHeader }

        // Construir los parámetros de búsqueda
        // Preferimos imdbId por su precisión; si no, usamos el título principal
        const params = new URLSearchParams({
            languages: 'es',
            order_by: 'download_count',
            order_direction: 'desc'
        })

        if (episode != null) params.set('episode_number', episode)

        if (imdbId) {
            // OpenSubtitles espera el ID sin el prefijo "tt" y sin ceros a la izquierda
            params.set('imdb_id', imdbId.replace(/^tt0*/, ''))
        } else if (titles?.length) {
            params.set('query', titles[0])
        } else {
            return []
        }

        // Paso 1: Buscar subtítulos disponibles
        let searchData
        try {
            const searchRes = await apiFetch(
                `https://api.opensubtitles.com/api/v1/subtitles?${params.toString()}`,
                { headers: headersWithAuth }
            )
            if (!searchRes.ok) throw new Error(`HTTP ${searchRes.status}`)
            searchData = await searchRes.json()
        } catch (e) {
            throw new Error(`Error buscando en OpenSubtitles: ${e.message}`)
        }

        const subtitles = searchData?.data
        if (!subtitles?.length) return []

        // Paso 2: Obtener los enlaces de descarga para los primeros resultados
        const results = []

        for (const sub of subtitles.slice(0, 5)) {
            const fileId = sub?.attributes?.files?.[0]?.file_id
            if (!fileId) continue

            try {
                const dlRes = await apiFetch('https://api.opensubtitles.com/api/v1/download', {
                    method: 'POST',
                    headers: headersWithAuth,
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
