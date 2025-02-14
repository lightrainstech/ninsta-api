const S = require('fluent-json-schema')

exports.assetSchema = {
  tags: ['Asset'],
  summary: 'Add asset',
  body: S.object()
    .prop('title', S.string().minLength(4).maxLength(40).required())
    .prop('description', S.string().minLength(4).maxLength(40).required())
    .prop('wallet', S.string().pattern('^0x[a-fA-F0-9]{40}$').required())
    .prop('royalty', S.string().pattern('^0x[a-fA-F0-9]{40}$'))
    .prop('royaltyPer', S.number())
    .prop('handle', S.string().minLength(3)),
  security: [{ Bearer: [] }]
}

exports.assetUpdateSchema = {
  tags: ['Asset'],
  summary: 'Update asset',
  body: S.object()
    .prop('docId', S.string().pattern('^[a-fA-F0-9]{24}$').required())
    .prop('tokenId', S.number().minimum(0).required()),
  security: [{ Bearer: [] }]
}

exports.getAssetSchema = {
  tags: ['Asset'],
  summary: 'Get user assets',
  security: [{ Bearer: [] }]
}
exports.uploadSchema = {
  tags: ['Asset'],
  summary: 'Add asset',
  formData: S.object().prop('files', S.string().required()),
  security: [{ Bearer: [] }]
}
