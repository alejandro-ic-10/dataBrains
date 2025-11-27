from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import pandas as pd
from pathlib import Path

# ========== 0. Rutas base ==========
BASE_DIR = Path(__file__).resolve().parent
RUTA_MODELO = BASE_DIR / "Modelo_Final.joblib"
RUTA_CSV = BASE_DIR / "ddf4_limpio.csv"

# ========== 1. Cargar modelo y CSV con medianas ==========
modelo = joblib.load(RUTA_MODELO)

df_limpio = pd.read_csv(RUTA_CSV)
medianas = df_limpio.median(numeric_only=True)

# ========== 2. Columnas finales que espera el modelo ==========
COLUMNAS = [
    "mileage",
    "fuel_tank_volume_numeric",
    "torque_numeric",
    "age",
    "horsepower",
    "wheel_system_AWD",
    "back_legroom_numeric",
    "height_numeric",
    "width_numeric",
    "engine_displacement",
    "wheel_system_FWD",
    "body_type_SUV / Crossover",
    "maximum_seating_numeric",
    "is_new",
    "make_name_BMW",
    "length_numeric",
    "model_name_Otro",
    "is_diesel",
    "body_type_Pickup Truck",
    "wheelbase_numeric",
    "make_name_Dodge",
    "front_legroom_numeric",
    "make_name_Cadillac",
    "combine_fuel_economy",
    "savings_amount",
    "make_name_Ford",
    "wheel_system_4X2",
    "make_name_Otro",
    "seller_rating",
    "make_name_Kia",
    "engine_config_V8",
    "highway_fuel_economy",
    "is_electric",
    "make_name_Volvo",
    "engine_config_I4",
    "engine_config_I6",
    "city_fuel_economy",
    "model_name_Durango",
    "make_name_Mercedes-Benz",
    "make_name_Lexus",
]

# ========== 3. Helper: valor del usuario o mediana del CSV ==========
def valor_o_mediana(nombre_columna: str, valor_usuario):
    """
    Si el usuario proporciona valor_usuario (no None) -> se usa.
    Si viene None -> se usa la mediana de esa columna en ddf4_limpio.csv.
    Si la columna no está en medianas -> se devuelve 0.0.
    """
    if valor_usuario is not None:
        return float(valor_usuario)

    if nombre_columna in medianas.index:
        return float(medianas[nombre_columna])

    return 0.0


# ========== 4. Construir DataFrame final a partir del input ==========
def construir_df_desde_inputs(
    mileage=None,
    year=None,
    make_name=None,
    model_name=None,
    fuel_type=None,
    body_type=None,
    engine_config=None,
    wheel_system=None,
    fuel_tank_volume_numeric=None,
    torque_numeric=None,
    horsepower=None,
    back_legroom_numeric=None,
    height_numeric=None,
    width_numeric=None,
    engine_displacement=None,
    maximum_seating_numeric=None,
    is_new=None,
    length_numeric=None,
    wheelbase_numeric=None,
    front_legroom_numeric=None,
    city_fuel_economy=None,
    highway_fuel_economy=None,
    savings_amount=None,
    seller_rating=None,
):
    # 1) Inicializar todas las columnas en 0.0
    datos = {col: 0.0 for col in COLUMNAS}

    # 2) Numéricas con valor o mediana
    datos["mileage"] = valor_o_mediana("mileage", mileage)
    datos["fuel_tank_volume_numeric"] = valor_o_mediana(
        "fuel_tank_volume_numeric", fuel_tank_volume_numeric
    )
    datos["torque_numeric"] = valor_o_mediana("torque_numeric", torque_numeric)
    datos["horsepower"] = valor_o_mediana("horsepower", horsepower)
    datos["back_legroom_numeric"] = valor_o_mediana(
        "back_legroom_numeric", back_legroom_numeric
    )
    datos["height_numeric"] = valor_o_mediana("height_numeric", height_numeric)
    datos["width_numeric"] = valor_o_mediana("width_numeric", width_numeric)
    datos["engine_displacement"] = valor_o_mediana(
        "engine_displacement", engine_displacement
    )
    datos["maximum_seating_numeric"] = valor_o_mediana(
        "maximum_seating_numeric", maximum_seating_numeric
    )
    datos["length_numeric"] = valor_o_mediana("length_numeric", length_numeric)
    datos["wheelbase_numeric"] = valor_o_mediana(
        "wheelbase_numeric", wheelbase_numeric
    )
    datos["front_legroom_numeric"] = valor_o_mediana(
        "front_legroom_numeric", front_legroom_numeric
    )
    datos["city_fuel_economy"] = valor_o_mediana(
        "city_fuel_economy", city_fuel_economy
    )
    datos["highway_fuel_economy"] = valor_o_mediana(
        "highway_fuel_economy", highway_fuel_economy
    )
    datos["savings_amount"] = valor_o_mediana("savings_amount", savings_amount)
    datos["seller_rating"] = valor_o_mediana("seller_rating", seller_rating)

    # 3) age = 2025 - year, si year no viene usamos mediana de 'age'
    if year is not None:
        try:
            datos["age"] = 2025 - int(year)
        except Exception:
            datos["age"] = valor_o_mediana("age", None)
    else:
        datos["age"] = valor_o_mediana("age", None)

    # 4) combine_fuel_economy (si el usuario dio city & highway, sino usamos mediana)
    if (
        city_fuel_economy is not None
        and highway_fuel_economy is not None
        and city_fuel_economy > 0
        and highway_fuel_economy > 0
    ):
        datos["combine_fuel_economy"] = 1 / (
            (0.55 / float(city_fuel_economy))
            + (0.45 / float(highway_fuel_economy))
        )
    else:
        datos["combine_fuel_economy"] = valor_o_mediana(
            "combine_fuel_economy", None
        )

    # 5) is_new (booleano)
    if is_new is not None:
        datos["is_new"] = 1.0 if is_new else 0.0
    else:
        datos["is_new"] = valor_o_mediana("is_new", None)

    # 6) fuel_type -> is_diesel / is_electric
    if fuel_type:
        ft = str(fuel_type).lower()
        if "diesel" in ft:
            datos["is_diesel"] = 1.0
        if "electric" in ft:
            datos["is_electric"] = 1.0

    # 7) wheel_system -> wheel_system_AWD / FWD / 4X2
    # Permitimos: FWD, AWD, 4X2, RWD, 4WD
    if wheel_system:
        ws = str(wheel_system).upper().strip()
        if ws == "AWD":
            datos["wheel_system_AWD"] = 1.0
        elif ws == "FWD":
            datos["wheel_system_FWD"] = 1.0
        elif ws == "4X2":
            datos["wheel_system_4X2"] = 1.0
        elif ws == "4WD":
            # Aproximamos 4WD a AWD
            datos["wheel_system_AWD"] = 1.0
        elif ws == "RWD":
            # Aproximamos RWD a 4X2 (dos ruedas motrices)
            datos["wheel_system_4X2"] = 1.0
        # Cualquier otro valor -> se quedan las tres en 0 (categoría base)

  
    if body_type:
        bt = str(body_type).strip()
        if bt == "SUV / Crossover":
            datos["body_type_SUV / Crossover"] = 1.0
        elif bt == "Pickup Truck":
            datos["body_type_Pickup Truck"] = 1.0

    # 9) make_name -> columnas de marca
    if make_name:
        mk = str(make_name).strip()
        if mk == "Ford":
            datos["make_name_Ford"] = 1.0
        elif mk == "BMW":
            datos["make_name_BMW"] = 1.0
        elif mk == "Dodge":
            datos["make_name_Dodge"] = 1.0
        elif mk == "Cadillac":
            datos["make_name_Cadillac"] = 1.0
        elif mk == "Kia":
            datos["make_name_Kia"] = 1.0
        elif mk == "Volvo":
            datos["make_name_Volvo"] = 1.0
        elif mk == "Mercedes-Benz":
            datos["make_name_Mercedes-Benz"] = 1.0
        elif mk == "Lexus":
            datos["make_name_Lexus"] = 1.0
        else:
            datos["make_name_Otro"] = 1.0

    if model_name:
        mn = str(model_name).strip()
        if mn == "Durango":
            datos["model_name_Durango"] = 1.0
        else:
            datos["model_name_Otro"] = 1.0
    else:
        datos["model_name_Otro"] = 1.0


    if engine_config:
        ec = str(engine_config).upper().strip()
        if ec == "I4":
            datos["engine_config_I4"] = 1.0
        elif ec in ("I6", "V6"):
            datos["engine_config_I6"] = 1.0
        elif ec == "V8":
            datos["engine_config_V8"] = 1.0
       

    # 12) Devolver DataFrame con una sola fila
    return pd.DataFrame([datos], columns=COLUMNAS)


app = FastAPI(title="API Precio Vehículos")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class CarInput(BaseModel):
    # Todos los campos como opcionales para poder probar medianas
    mileage: float | None = None
    year: int | None = None
    make_name: str | None = None
    model_name: str | None = None
    fuel_type: str | None = None
    body_type: str | None = None
    engine_config: str | None = None
    wheel_system: str | None = None
    fuel_tank_volume_numeric: float | None = None
    torque_numeric: float | None = None
    horsepower: float | None = None
    back_legroom_numeric: float | None = None
    height_numeric: float | None = None
    width_numeric: float | None = None
    engine_displacement: float | None = None
    maximum_seating_numeric: float | None = None
    is_new: bool | None = None
    length_numeric: float | None = None
    wheelbase_numeric: float | None = None
    front_legroom_numeric: float | None = None
    city_fuel_economy: float | None = None
    highway_fuel_economy: float | None = None
    savings_amount: float | None = None
    seller_rating: float | None = None


@app.post("/predict")
def predict(car: CarInput):
    # Construimos DF con lógica de medianas
    df = construir_df_desde_inputs(**car.dict())
    pred = modelo.predict(df)[0]
    precio = round(float(pred), 2)

    # Para ver qué valores se usaron realmente (incluyendo medianas)
    fila_usada = df.iloc[0].to_dict()

    return {
        "predicted_price": precio,
        "used_features": fila_usada,
        "raw_input": car.dict(),
    }


@app.get("/health")
def health():
    return {"status": "ok"}
