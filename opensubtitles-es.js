export default new class extends SubtitleSource {

    async test() {
        console.log("========== TEST ==========");
        console.log("SubtitleSource cargado correctamente");
        console.log("==========================");

        return true;
    }

    async single(query) {

        console.log("");
        console.log("========== QUERY ==========");
        console.log(query);
        console.log("==========================");

        console.log("");
        console.log("========== KEYS ==========");
        console.log(Object.keys(query));
        console.log("==========================");

        console.log("");
        console.log("========== QUERY JSON ==========");
        try {
            console.log(JSON.stringify(query, null, 2));
        } catch (e) {
            console.log("No se pudo convertir a JSON");
        }

        console.log("===============================");

        console.log("");
        console.log("========== FETCH TEST ==========");

        try {

            const res = await query.fetch("https://httpbin.org/anything", {
                method: "GET",
                headers: {
                    "Api-Key": "TEST_API_KEY",
                    "User-Agent": "Hayase Debug"
                }
            });

            console.log("HTTP:", res.status);

            const data = await res.json();

            console.log("Respuesta:");
            console.log(data);

        } catch (err) {

            console.log("ERROR EN FETCH");
            console.log(err);

        }

        console.log("==============================");

        return [];

    }

}
