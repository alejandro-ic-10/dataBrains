// ===================== CONFIGURACIÓN =====================

// Cambia esto cuando publiques la API en AWS
const API_URL = "http://127.0.0.1:8000/predict";
const HEALTH_URL = "http://127.0.0.1:8000/health";

let makeModelMap = {};
let modelBodyTypeMap = {};

// ===================== INICIALIZACIÓN =====================

document.addEventListener("DOMContentLoaded", () => {
  // Scroll suave para botones del header y hero
  document.querySelectorAll("[data-scroll]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-scroll");
      const el = document.querySelector(target);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    });
  });

  initApp();
});

async function initApp() {
  checkApiHealth();
  await cargarMapasDependencias();
  wireEvents();
}

// ===================== CARGA DE JSON (marcas / modelos / carrocerías) =====================

async function cargarMapasDependencias() {
  try {
    const [makeModelResp, bodyTypeResp] = await Promise.all([
      fetch("make_model_dependency_map.json"),
      fetch("model_body_type_dependency_map.json"),
    ]);

    makeModelMap = await makeModelResp.json();
    modelBodyTypeMap = await bodyTypeResp.json();

    poblarMarcas();
  } catch (err) {
    console.error("Error cargando JSONs de dependencias:", err);
    const apiStatus = document.getElementById("apiStatus");
    apiStatus.textContent =
      "No se pudieron cargar los JSON de dependencias. Revisa que los archivos estén en la misma carpeta que index.html.";
    apiStatus.className = "alert-error";
  }
}

function poblarMarcas() {
  const makeSelect = document.getElementById("makeSelect");
  makeSelect.innerHTML = '<option value="">Selecciona marca</option>';

  const makes = Object.keys(makeModelMap).sort();
  makes.forEach((make) => {
    const opt = document.createElement("option");
    opt.value = make;
    opt.textContent = make;
    makeSelect.appendChild(opt);
  });
}

function poblarModelos() {
  const makeSelect = document.getElementById("makeSelect");
  const modelSelect = document.getElementById("modelSelect");
  const bodyTypeSelect = document.getElementById("bodyTypeSelect");

  const make = makeSelect.value;
  modelSelect.innerHTML = '<option value="">Selecciona modelo</option>';
  bodyTypeSelect.innerHTML = '<option value="">Selecciona carrocería</option>';
  bodyTypeSelect.disabled = true;

  if (!make || !makeModelMap[make]) {
    modelSelect.disabled = true;
    return;
  }

  const modelos = makeModelMap[make] || [];
  modelos.forEach((model) => {
    const opt = document.createElement("option");
    opt.value = model;
    opt.textContent = model;
    modelSelect.appendChild(opt);
  });

  modelSelect.disabled = false;
}

function poblarBodyTypes() {
  const modelSelect = document.getElementById("modelSelect");
  const bodyTypeSelect = document.getElementById("bodyTypeSelect");

  const model = modelSelect.value;
  bodyTypeSelect.innerHTML = '<option value="">Selecciona carrocería</option>';

  if (!model) {
    bodyTypeSelect.disabled = true;
    return;
  }

  // Usa el mapa para ese modelo; o "Otro" como fallback
  const bodyTypes = modelBodyTypeMap[model] || modelBodyTypeMap["Otro"] || [];
  bodyTypes.forEach((bt) => {
    const opt = document.createElement("option");
    opt.value = bt;
    opt.textContent = bt;
    bodyTypeSelect.appendChild(opt);
  });

  bodyTypeSelect.disabled = false;
}

// ===================== EVENTOS =====================

function wireEvents() {
  document
    .getElementById("makeSelect")
    .addEventListener("change", poblarModelos);
  document
    .getElementById("modelSelect")
    .addEventListener("change", poblarBodyTypes);

  document
    .getElementById("predictBtn")
    .addEventListener("click", enviarPrediccion);
}

// ===================== HEALTHCHECK API =====================

async function checkApiHealth() {
  const apiStatus = document.getElementById("apiStatus");
  try {
    const resp = await fetch(HEALTH_URL);
    if (!resp.ok) throw new Error("No OK");
    const data = await resp.json();
    if (data.status === "ok") {
      apiStatus.textContent = "API en línea en http://127.0.0.1:8000";
      apiStatus.className = "hint";
    } else {
      apiStatus.textContent = "API respondió pero con un estado inesperado.";
      apiStatus.className = "alert-error";
    }
  } catch (err) {
    apiStatus.textContent =
      "No se pudo conectar a la API. ¿Ejecutaste `python -m uvicorn Main:app --reload`?";
    apiStatus.className = "alert-error";
  }
}

// ===================== PREDICCIÓN =====================

async function enviarPrediccion() {
  const make = document.getElementById("makeSelect").value;
  const model = document.getElementById("modelSelect").value;
  const bodyType = document.getElementById("bodyTypeSelect").value;
  const year = document.getElementById("yearInput").value;
  const mileage = document.getElementById("mileageInput").value;
  const fuelType = document.getElementById("fuelTypeSelect").value;
  const engineConfig = document.getElementById("engineConfigSelect").value;
  const wheelSystem = document.getElementById("wheelSystemSelect").value;

  const horsepower = document.getElementById("horsepowerInput").value;
  const cityFuel = document.getElementById("cityFuelInput").value;
  const hwyFuel = document.getElementById("hwyFuelInput").value;
  const isNewVal = document.getElementById("isNewSelect").value;

  const resultContainer = document.getElementById("resultContainer");
  const debugContainer = document.getElementById("debugContainer");
  resultContainer.innerHTML = "";
  debugContainer.innerHTML = "";

  // -------- Validación mínima: obligatorios --------
  if (
    !make ||
    !model ||
    !bodyType ||
    !year ||
    !mileage ||
    !fuelType ||
    !engineConfig ||
    !wheelSystem
  ) {
    resultContainer.innerHTML =
      '<div class="alert-error">Por favor llena todos los campos marcados con *.</div>';
    return;
  }

  // -------- VALIDACIONES ESTRICTAS DE RANGO --------

  const errors = [];

  function validarNumero(nombre, valor, min, max, obligatorio) {
    if (valor === "" || valor === null || valor === undefined) {
      if (obligatorio) {
        errors.push(`${nombre} es obligatorio.`);
      }
      return;
    }
    const num = Number(valor);
    if (isNaN(num)) {
      errors.push(`${nombre} debe ser un número válido.`);
      return;
    }
    if (num < min || num > max) {
      errors.push(`${nombre} debe estar entre ${min} y ${max}.`);
    }
  }

  // Obligatorios
  validarNumero("Año", year, 1980, 2025, true);
  validarNumero("Kilometraje", mileage, 0, 500000, true);

  // Opcionales
  validarNumero("Caballos de fuerza", horsepower, 40, 1000, false);
  validarNumero("Consumo ciudad", cityFuel, 3, 80, false);
  validarNumero("Consumo carretera", hwyFuel, 3, 80, false);

  // Relación lógica consumo carretera >= ciudad
  if (cityFuel && hwyFuel) {
    const cityNum = Number(cityFuel);
    const hwyNum = Number(hwyFuel);
    if (!isNaN(cityNum) && !isNaN(hwyNum) && hwyNum < cityNum) {
      errors.push(
        "El consumo en carretera debe ser mayor o igual al consumo en ciudad."
      );
    }
  }

  if (errors.length > 0) {
    resultContainer.innerHTML =
      '<div class="alert-error">' + errors.join("<br>") + "</div>";
    return;
  }

  // -------- Construir payload limpio --------

  const payload = {
    mileage: mileage ? Number(mileage) : null,
    year: year ? Number(year) : null,
    make_name: make,
    model_name: model,
    fuel_type: fuelType,
    body_type: bodyType,
    engine_config: engineConfig,
    wheel_system: wheelSystem,

    fuel_tank_volume_numeric: null,
    torque_numeric: null,
    horsepower: horsepower ? Number(horsepower) : null,
    back_legroom_numeric: null,
    height_numeric: null,
    width_numeric: null,
    engine_displacement: null,
    maximum_seating_numeric: null, // se rellena con mediana en backend
    is_new: isNewVal === "" ? null : isNewVal === "true",
    length_numeric: null,
    wheelbase_numeric: null,
    front_legroom_numeric: null,
    city_fuel_economy: cityFuel ? Number(cityFuel) : null,
    highway_fuel_economy: hwyFuel ? Number(hwyFuel) : null,
    savings_amount: null,
    seller_rating: null // también con mediana
  };

  // -------- Llamada a la API --------

  try {
    const resp = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      throw new Error("Respuesta no OK de la API");
    }

    const data = await resp.json();

    // Mostrar precio
    const price = data.predicted_price ?? null;
    if (price === null) {
      resultContainer.innerHTML =
        '<div class="alert-error">La API no devolvió un precio. Revisa el backend.</div>';
    } else {
      const pretty = Number(price).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

      resultContainer.innerHTML = `
        <div class="result-box">
          <div style="font-size:1.6rem;font-weight:700;">
            $ ${pretty} <span style="font-size:0.8rem;font-weight:400;color:#9ca3af;">USD (estimado)</span>
          </div>
          <div class="hint">
            Este valor es una estimación basada en el modelo entrenado y en los datos ingresados.
          </div>
        </div>
      `;
    }

    // Debug: mostrar raw_input y used_features
    const rawInput = data.raw_input || {};
    const usedFeatures = data.used_features || {};

    debugContainer.innerHTML = `
      <div>
        <p class="hint">Haz clic para ver/ocultar detalles técnicos.</p>

        <div style="margin-top:8px;cursor:pointer;color:#93c5fd;" onclick="
          const x = this.nextElementSibling;
          x.style.display = x.style.display === 'none' ? 'block' : 'none';
        ">
          Ver/ocultar JSON enviado (raw_input)
        </div>
        <pre style="display:none;background:#020617;border-radius:8px;padding:8px;font-size:0.75rem;max-height:200px;overflow:auto;">
${JSON.stringify(rawInput, null, 2)}
        </pre>

        <div style="margin-top:8px;cursor:pointer;color:#93c5fd;" onclick="
          const x = this.nextElementSibling;
          x.style.display = x.style.display === 'none' ? 'block' : 'none';
        ">
          Ver/ocultar features finales usadas por el modelo (used_features)
        </div>
        <pre style="display:none;background:#020617;border-radius:8px;padding:8px;font-size:0.75rem;max-height:200px;overflow:auto;">
${JSON.stringify(usedFeatures, null, 2)}
        </pre>
      </div>
    `;
  } catch (err) {
    console.error(err);
    resultContainer.innerHTML =
      '<div class="alert-error">Ocurrió un error al consultar la API. Revisa que esté levantada en http://127.0.0.1:8000.</div>';
  }
}
