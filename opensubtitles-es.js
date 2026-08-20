export default class extends Extension {

    // Cambiamos el nombre de la función a lo que Hayase espera nativamente
    async single(query) {

        console.log("=======================================");
        console.log("🕵️ INICIANDO DIAGNÓSTICO DE HAYASE 🕵️");
        console.log("=======================================");

        // --- PRUEBA 1: ¿Qué contiene 'query'? ---
        console.log("\n>>> PRUEBA 1: CONTENIDO DE QUERY:");
        try {
            // Lo convertimos a texto para que la terminal lo lea fácil
            console.log(JSON.stringify(query, null, 2));
        } catch (e) {
            console.log("No se pudo parsear query:", query);
        }

        // --- PRUEBA 2: ¿Admite cabeceras el fetch nativo? ---
        console.log("\n>>> PRUEBA 2: ENVIANDO HEADERS A HTTPBIN...");
        try {
            // httpbin.org es una web que simplemente te devuelve como un espejo lo que le envías
            const res = await query.fetch("https://httpbin.org/headers", {
                headers: {
                    "Api-Key": "LLAVE-PRUEBA-ZAFRONT",
                    "User-Agent": "Hayase Test"
                }
            });
            console.log("Respuesta del servidor espejo:", res);
        } catch (error) {
            console.log("❌ Falló la Prueba 2. query.fetch no funciona así:", error.message);
        }

        // --- PRUEBA 3: Forzar el formato de salida ---
        console.log("\n>>> PRUEBA 3: ENVIANDO SUBTÍTULO FALSO...");

        // Le devolvemos a Hayase un enlace fijo (usamos una URL tuya que sabemos que no rompe nada)
        return [
            {
                url: "https://raw.githubusercontent.com/Zafront/hayase-subs-es/main/index.json",
                language: "ES"
            }
        ];
    }
}
