export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Consultar todos los empleados
    if (url.pathname === "/api/empleados" && request.method === "GET") {
      try {
        const resultado = await env.DB.prepare(
          "SELECT * FROM empleados ORDER BY id_empleado"
        ).all();

        return Response.json({
          success: true,
          total: resultado.results.length,
          empleados: resultado.results
        });
      } catch (error) {
        return Response.json({
          success: false,
          error: error.message
        }, { status: 500 });
      }
    }
 return env.ASSETS.fetch(request);
  }
};