export default class OpenSubtitlesEs {
    // Hayase llamará a esta función automáticamente
    async searchSubtitles(title, episode) {
        try {
            // 1. Buscamos el ID
            const searchUrl = `https://api.opensubtitles.com/api/v1/subtitles?query=${encodeURIComponent(title)}&languages=es`;
            const searchRes = await fetch(searchUrl, {
                method: 'GET',
                headers: {
                    'Api-Key': 'PNHuQbK2DJz9WKGmi6uTXxLQoUXutP9K',
                    'User-Agent': 'HayaseSubsZafront v1.0'
                }
            });
            const searchData = await searchRes.json();

            if (!searchData.data || searchData.data.length === 0) {
                return null; // No hay subtítulos
            }

            const fileId = parseInt(searchData.data[0].attributes.files[0].file_id, 10);

            // 2. Pedimos el enlace de descarga
            const downloadUrl = 'https://api.opensubtitles.com/api/v1/download';
            const downloadRes = await fetch(downloadUrl, {
                method: 'POST',
                headers: {
                    'Api-Key': 'PNHuQbK2DJz9WKGmi6uTXxLQoUXutP9K',
                    'User-Agent': 'HayaseSubsZafront v1.0',
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ file_id: fileId })
            });
            const downloadData = await downloadRes.json();

            // Le devolvemos el enlace limpio a la aplicación
            return downloadData.link;

        } catch (error) {
            return null; // Si algo falla, que Hayase no se cuelgue
        }
    }
}