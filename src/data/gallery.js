// Trabajos de Andreina publicados en @yuye_nailss.es.
// `extra` es la decoración que se preselecciona al pulsar "Reservar este diseño".
// `category` es la etiqueta que se ve arriba de cada tarjeta del carrusel.
const img = (name) => `./galeria/${name}.jpg`

export const GALLERY = [
  { src: img('chocolate-flor'), title: 'Chocolate y flor', category: 'Flores 3D', detail: 'Ojo de gato chocolate, francesa oscura y flor en relieve con bolitas doradas.', shape: 'Almendra', extra: 'relieve' },
  { src: img('francesa-cereza'), title: 'Francesa cereza', category: 'Francesa', detail: 'Punta vino sobre nude y una estrella plateada en el anular.', shape: 'Almendra', extra: 'francesa' },
  { src: img('ojo-gato-malva'), title: 'Ojo de gato malva', category: 'Ojo de gato', detail: 'Efecto magnético en malva humo, de un solo color.', shape: 'Almendra', extra: 'ojo-gato' },
  { src: img('hibisco-rosa'), title: 'Hibisco rosa', category: 'De autora', detail: 'Flores pintadas a mano, conchas en relieve y bolitas doradas.', shape: 'Almendra larga', extra: 'autor' },
  { src: img('lunares-moca'), title: 'Lunares moca', category: 'Mano alzada', detail: 'Chocolate brillante con una uña blanca de lunares.', shape: 'Almendra', extra: 'mano-alzada' },
  { src: img('brisa-de-mar'), title: 'Brisa de mar', category: 'De autora', detail: 'Francesa aguamarina, flor, gotas y concha 3D.', shape: 'Cuadrada', extra: 'autor' },
  { src: img('jirafa-francesa'), title: 'Jirafa y francesa', category: 'Animal print', detail: 'Animal print chocolate alternado con francesa blanca.', shape: 'Almendra', extra: 'mano-alzada' },
  { src: img('estrellas-cromadas'), title: 'Estrellas cromadas', category: 'Cromado', detail: 'Cromado con estrellas y francesa de lunares.', shape: 'Almendra corta', extra: 'autor' },
]
