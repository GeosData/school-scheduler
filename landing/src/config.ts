/**
 * Config del producto — lo único que se edita para ajustar la landing.
 */
export const product = {
  name: 'Horarios Escolares',
  site: 'https://horarios-escolares.geosdata.com',
  version: '1.0.0',

  title: 'Generador de horarios escolares gratis, sin internet | Horarios Escolares',
  description:
    'Programa gratis para armar el horario de tu colegio sin choques y sin pelear con Excel. Funciona sin internet, sin instalar nada. Preescolar, primaria y secundaria según el MEN. Exporta a imagen e imprime.',

  downloadUrl: '/descargar', // redirige (public/_redirects) al .exe de la release
  reportUrl: '/reportar',
  exeSize: '~80 MB',

  brand: 'Geosdata',
  brandUrl: 'https://geosdata.com',
} as const;
