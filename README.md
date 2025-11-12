# Mejor Precio de Auto

- Facultad de Ingeniería UNAM
- Semestre 2026-1
- Ciencia de Datos en la Toma de Decisiones de las Organizaciones

### Equipo Data Brains

Integrantes:

- SANTIAGO PEREZ DANIELA
- HERNANDEZ GONZALEZ ANDRES SEBASTIAN
- RODRIGUEZ LARIOS ALEJANDRO
- ALBARRAN PACHECO GABRIELA
- CELIS HERNANDEZ RONIE

## Descripción del Proyecto
Este proyecto tiene como objetivo **predecir el precio de un coche usado** a partir de sus características más relevantes, utilizando técnicas de **aprendizaje automático**.  

Surge del contexto del mercado automotriz tras la crisis sanitaria de 2020, cuando la escasez de semiconductores y la reducción en la producción de vehículos nuevos provocaron un aumento inesperado en el valor de los autos usados.

El notebook **`DataBrains_Precio_Coches_Usados.ipynb`** desarrolla un modelo de regresión (por ejemplo, `RandomForestRegressor`) capaz de identificar los factores que más influyen en el valor de un vehículo, permitiendo realizar estimaciones precisas y útiles para compradores, vendedores y concesionarios.

## Flujo del Proyecto

1. **Importación y exploración de datos**
   - Carga de un dataset con información de coches usados.
   - Análisis exploratorio (EDA) para entender la distribución de precios y variables clave.

2. **Limpieza y preparación**
   - Tratamiento de valores nulos y atípicos.
   - Codificación de variables categóricas (marca, modelo, tipo de combustible, etc.).
   - Escalado de variables numéricas.

3. **Modelado predictivo**
   - Entrenamiento de modelos de regresión (Random Forest, Gradient Boosting, o similares).
   - Evaluación mediante métricas como RMSE, MAE y R².

4. **Interpretación de resultados**
   - Identificación de las variables que más afectan el precio.
   - Visualización de la importancia de las características.

5. **Conclusiones**
   - Se destacan los factores más determinantes del precio.
   - Se plantea la posibilidad de implementar el modelo como una herramienta de valoración automatizada.


## Tecnologías Utilizadas

- **Python**
- **Pandas**, **NumPy** – manejo y análisis de datos  
- **Matplotlib**, **Seaborn** – visualización  
- **Scikit-learn** – modelado de machine learning  
- **Jupyter Notebook**



## Resultados Esperados

- Un modelo capaz de **predecir el valor de un coche usado** con buena precisión.  
- Comprensión de los factores que **más impactan en el precio**, como año, kilometraje, marca y condición.  
- Base para construir una **herramienta de estimación automática** útil para el mercado automotriz.
