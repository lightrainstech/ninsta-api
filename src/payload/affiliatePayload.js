const S = require('fluent-json-schema')

exports.affSchema = {
  tags: ['Affiliate'],
  summary: 'Get Affiliate Code',
  body: S.object().prop(
    'affEmail',
    S.string().format(S.FORMATS.EMAIL).required()
  ),
  security: [{ Bearer: [] }]
}

exports.uploadSchema = {
  tags: ['Affiliate'],
  summary: 'Add Affiliate',
  formData: S.object().prop('files', S.string().required()),
  security: [{ Bearer: [] }]
}
