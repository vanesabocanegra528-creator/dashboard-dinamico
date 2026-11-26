
const formulario = document.getElementById("formularioEmpleado");
const tablaDatos = document.getElementById("tablaDatos");

const totalDatos = document.getElementById("totalDatos");
const valorTotal = document.getElementById("valorTotal");
const promedio = document.getElementById("promedio");

const estadoCarga = document.getElementById("estadoCarga");
const mensajeFormulario = document.getElementById("mensajeFormulario");

const canvas = document.getElementById("grafica");
const contexto = canvas.getContext("2d");

let empleados = [];

const formatoNumero = new Intl.NumberFormat("es-CO", {
    maximumFractionDigits: 0
});

const formatoMoneda = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
});

// Consultar empleados almacenados en D1.
async function cargarEmpleados() {
    estadoCarga.textContent = "Cargando información...";

    try {
        const respuesta = await fetch("/api/empleados");
        const resultado = await respuesta.json();

        if (!respuesta.ok || !resultado.success) {
            throw new Error(resultado.error || "No fue posible consultar los empleados.");
        }

        empleados = resultado.empleados;

        actualizarDashboard();

        estadoCarga.textContent =
            "Información cargada correctamente: " +
            resultado.total + " empleados.";

    } catch (error) {
        estadoCarga.textContent = "Error al cargar los datos.";
        console.error(error);
    }
}

// Registrar empleado en Cloudflare D1.
formulario.addEventListener("submit", async function(evento) {
    evento.preventDefault();

    const datos = {
        nombre_completo: document.getElementById("nombreEmpleado").value.trim(),
        tipo_documento: document.getElementById("tipoDocumento").value,
        numero_documento: document.getElementById("numeroDocumento").value.trim(),
        correo_corporativo: document.getElementById("correo").value.trim(),
        telefono: document.getElementById("telefono").value.trim(),
        cargo: document.getElementById("cargo").value.trim(),
        area: document.getElementById("area").value.trim(),
        fecha_ingreso: document.getElementById("fechaIngreso").value,
        salario_mensual_cop: Number(document.getElementById("salario").value),
        turno: document.getElementById("turno").value,
        ciudad: document.getElementById("ciudad").value.trim(),
        estado: document.getElementById("estadoEmpleado").value
    };

    if (!formulario.reportValidity()) {
        return;
    }

    mensajeFormulario.textContent = "Guardando empleado...";
    mensajeFormulario.style.color = "#2583c5";

    const boton = formulario.querySelector('button[type="submit"]');
    boton.disabled = true;

    try {
        const respuesta = await fetch("/api/empleados", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(datos)
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok || !resultado.success) {
            throw new Error(resultado.error || "No se pudo registrar el empleado.");
        }

        mensajeFormulario.textContent =
            resultado.mensaje + " Código: " + resultado.id_empleado;

        mensajeFormulario.style.color = "green";

        formulario.reset();

        await cargarEmpleados();

    } catch (error) {
        mensajeFormulario.textContent = "Error: " + error.message;
        mensajeFormulario.style.color = "red";
        console.error(error);
    } finally {
        boton.disabled = false;
    }
});

// Actualizar tarjetas, tabla y gráfica.
function actualizarDashboard() {
    const activos = empleados.filter(function(empleado) {
        return empleado.estado &&
            empleado.estado.toLowerCase() === "activo";
    });

    const sumaSalarios = empleados.reduce(function(total, empleado) {
        return total + Number(empleado.salario_mensual_cop || 0);
    }, 0);

    const salarioPromedio = empleados.length > 0
        ? sumaSalarios / empleados.length
        : 0;

    totalDatos.textContent = formatoNumero.format(empleados.length);
    valorTotal.textContent = formatoNumero.format(activos.length);
    promedio.textContent = formatoMoneda.format(salarioPromedio);

    dibujarTabla();
    dibujarGrafica();
}

// Mostrar empleados en la tabla.
function dibujarTabla() {
    tablaDatos.replaceChildren();

    empleados.forEach(function(empleado) {
        const fila = document.createElement("tr");

        const valores = [
            empleado.id_empleado,
            empleado.nombre_completo,
            empleado.cargo,
            empleado.area,
            formatoMoneda.format(Number(empleado.salario_mensual_cop || 0)),
            empleado.estado
        ];

        valores.forEach(function(valor, indice) {
            const celda = document.createElement("td");
            celda.textContent = valor || "No registrado";

            if (indice === 5) {
                celda.className =
                    empleado.estado === "Activo"
                    ? "estado-activo"
                    : "estado-inactivo";
            }

            fila.appendChild(celda);
        });

        tablaDatos.appendChild(fila);
    });
}

// Agrupar empleados por área.
function dibujarGrafica() {
    const conteoAreas = {};

    empleados.forEach(function(empleado) {
        const area = empleado.area || "Sin área";
        conteoAreas[area] = (conteoAreas[area] || 0) + 1;
    });

    const areas = Object.keys(conteoAreas);
    const cantidades = Object.values(conteoAreas);

    const anchoCSS = canvas.clientWidth;
    const altoCSS = 280;
    const escala = window.devicePixelRatio || 1;

    canvas.width = anchoCSS * escala;
    canvas.height = altoCSS * escala;

    contexto.setTransform(escala, 0, 0, escala, 0, 0);
    contexto.clearRect(0, 0, anchoCSS, altoCSS);

    if (areas.length === 0) {
        contexto.fillStyle = "#657087";
        contexto.font = "16px Arial";
        contexto.textAlign = "center";
        contexto.fillText(
            "No hay empleados para mostrar",
            anchoCSS / 2,
            altoCSS / 2
        );
        return;
    }

    const margenIzquierdo = 45;
    const margenDerecho = 15;
    const margenSuperior = 20;
    const margenInferior = 55;

    const anchoUtil = anchoCSS - margenIzquierdo - margenDerecho;
    const altoUtil = altoCSS - margenSuperior - margenInferior;

    const maximo = Math.max(...cantidades, 1);
    const espacio = anchoUtil / areas.length;
    const anchoBarra = Math.max(4, espacio * 0.55);

    contexto.strokeStyle = "#dce3ed";
    contexto.beginPath();
    contexto.moveTo(margenIzquierdo, margenSuperior);
    contexto.lineTo(margenIzquierdo, altoCSS - margenInferior);
    contexto.lineTo(anchoCSS - margenDerecho, altoCSS - margenInferior);
    contexto.stroke();

    areas.forEach(function(area, indice) {
        const altura = (cantidades[indice] / maximo) * altoUtil;

        const x = margenIzquierdo + indice * espacio +
            (espacio - anchoBarra) / 2;

        const y = margenSuperior + altoUtil - altura;

        contexto.fillStyle = "#2583c5";
        contexto.fillRect(x, y, anchoBarra, altura);

        contexto.fillStyle = "#243047";
        contexto.font = "12px Arial";
        contexto.textAlign = "center";

        contexto.fillText(
            cantidades[indice],
            x + anchoBarra / 2,
            Math.max(12, y - 5)
        );

        let etiqueta = area;

        if (etiqueta.length > 12) {
            etiqueta = etiqueta.slice(0, 11) + "…";
        }

        contexto.fillText(
            etiqueta,
            x + anchoBarra / 2,
            altoCSS - margenInferior + 18
        );
    });
}

window.addEventListener("resize", dibujarGrafica);

// Cargar los empleados al abrir el dashboard.
cargarEmpleados();
