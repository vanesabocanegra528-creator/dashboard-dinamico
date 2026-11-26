
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Consultar empleados
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

    // Registrar un nuevo empleado
    if (url.pathname === "/api/empleados" && request.method === "POST") {
      try {
        const datos = await request.json();

        const campos = [
          "nombre_completo",
          "tipo_documento",
          "numero_documento",
          "correo_corporativo",
          "telefono",
          "cargo",
          "area",
          "fecha_ingreso",
          "turno",
          "ciudad",
          "estado"
        ];

        for (const campo of campos) {
          if (
            typeof datos[campo] !== "string" ||
            datos[campo].trim() === ""
          ) {
            return Response.json({
              success: false,
              error: "El campo " + campo + " es obligatorio."
            }, { status: 400 });
          }
        }

        const salario = Number(datos.salario_mensual_cop);

        if (!Number.isFinite(salario) || salario < 0) {
          return Response.json({
            success: false,
            error: "El salario debe ser un número válido."
          }, { status: 400 });
        }

        // Generar automáticamente el siguiente identificador.
        const ultimo = await env.DB.prepare(`
          SELECT MAX(CAST(SUBSTR(id_empleado, 5) AS INTEGER)) AS numero
          FROM empleados
          WHERE id_empleado GLOB 'EMP-[0-9]*'
        `).first();

        const siguiente = Number(ultimo?.numero || 0) + 1;
        const idEmpleado = "EMP-" + String(siguiente).padStart(3, "0");

        await env.DB.prepare(`
          INSERT INTO empleados (
            id_empleado,
            nombre_completo,
            tipo_documento,
            numero_documento,
            correo_corporativo,
            telefono,
            cargo,
            area,
            fecha_ingreso,
            salario_mensual_cop,
            turno,
            ciudad,
            estado
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          idEmpleado,
          datos.nombre_completo.trim(),
          datos.tipo_documento.trim(),
          datos.numero_documento.trim(),
          datos.correo_corporativo.trim(),
          datos.telefono.trim(),
          datos.cargo.trim(),
          datos.area.trim(),
          datos.fecha_ingreso.trim(),
          salario,
          datos.turno.trim(),
          datos.ciudad.trim(),
          datos.estado.trim()
        ).run();

        return Response.json({
          success: true,
          mensaje: "Empleado registrado correctamente.",
          id_empleado: idEmpleado
        }, { status: 201 });

      } catch (error) {
        return Response.json({
          success: false,
          error: error.message
        }, { status: 500 });
      }
    }

    // Servir los archivos del dashboard.
    return env.ASSETS.fetch(request);
  }
};
