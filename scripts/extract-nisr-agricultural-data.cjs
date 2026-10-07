const fs = require('node:fs')
const path = require('node:path')
const zlib = require('node:zlib')

function parseObjects(file) {
  const buffer = fs.readFileSync(file)
  const source = buffer.toString('latin1')
  const objects = new Map()
  for (const match of source.matchAll(/(\d+)\s+\d+\s+obj\b([\s\S]*?)\bendobj\b/g)) {
    objects.set(Number(match[1]), match[2])
  }
  function stream(id) {
    const body = objects.get(id) ?? ''
    const startToken = body.indexOf('stream')
    if (startToken < 0) return undefined
    let start = startToken + 6
    if (body[start] === '\r') start++
    if (body[start] === '\n') start++
    else if (body[start] === '\r') start++
    const end = body.indexOf('endstream', start)
    if (end < 0) return undefined
    let bytes = Buffer.from(body.slice(start, end), 'latin1')
    while (bytes.at(-1) === 10 || bytes.at(-1) === 13) bytes = bytes.subarray(0, -1)
    try {
      if (body.slice(0, startToken).includes('FlateDecode')) bytes = zlib.inflateSync(bytes)
    } catch { return undefined }
    return bytes
  }
  return { objects, stream }
}

function getCMap(fontId, objects, stream) {
  const fontBody = objects.get(fontId) ?? ''
  const mapId = Number(fontBody.match(/\/ToUnicode\s+(\d+)\s+\d+\s+R/)?.[1])
  if (!mapId) return undefined
  const text = stream(mapId)?.toString('latin1') ?? ''
  const map = new Map()
  const firstSource = text.match(/beginbfchar[\s\S]*?<([\da-f]+)>\s*<[\da-f]+>|beginbfrange[\s\S]*?<([\da-f]+)>\s*<[\da-f]+>/i)
  const width = (firstSource?.[1] ?? firstSource?.[2])?.length / 2 || 2
  for (const block of text.matchAll(/beginbfchar([\s\S]*?)endbfchar/g)) {
    for (const item of block[1].matchAll(/<([\da-f]+)>\s*<([\da-f]+)>/ig)) {
      map.set(item[1].toUpperCase(), item[2])
    }
  }
  for (const block of text.matchAll(/beginbfrange([\s\S]*?)endbfrange/g)) {
    for (const item of block[1].matchAll(/<([\da-f]+)>\s*<([\da-f]+)>\s*(<([\da-f]+)>|\[([\s\S]*?)\])/ig)) {
      const low = Number.parseInt(item[1], 16)
      const high = Number.parseInt(item[2], 16)
      const first = Number.parseInt(item[4] ?? '0', 16)
      const arrayValues = item[5]
        ? [...item[5].matchAll(/<([\da-f]+)>/ig)].map((value) => value[1])
        : undefined
      for (let code = low; code <= high && code - low < 4096; code++) {
        const sourceCode = code.toString(16).padStart(item[1].length, '0').toUpperCase()
        const target = arrayValues?.[code - low] ?? (first + code - low).toString(16).padStart(item[4]?.length ?? 4, '0')
        map.set(sourceCode, target.toUpperCase())
      }
    }
  }
  return { map, width }
}

function decode(bytes, fontName, fonts, cmaps) {
  const fontId = fonts.get(fontName)
  if (!fontId) return bytes.toString('latin1')
  if (!cmaps.has(fontId)) cmaps.set(fontId, getCMap(fontId, cmaps.objects, cmaps.stream))
  const cmap = cmaps.get(fontId)
  if (!cmap) return bytes.toString('latin1')
  let output = ''
  for (let offset = 0; offset < bytes.length; offset += cmap.width) {
    const key = bytes.subarray(offset, offset + cmap.width).toString('hex').toUpperCase()
    const target = cmap.map.get(key)
    if (!target) { output += '�'; continue }
    for (let index = 0; index < target.length; index += 4) {
      output += String.fromCharCode(Number.parseInt(target.slice(index, index + 4), 16))
    }
  }
  return output
}

function tokenize(content) {
  const result = []
  for (let index = 0; index < content.length;) {
    const char = content[index]
    if (/\s/.test(char)) { index++; continue }
    if (char === '%') { while (index < content.length && !/[\r\n]/.test(content[index])) index++; continue }
    if (char === '(') {
      let depth = 1
      const bytes = []
      index++
      while (index < content.length && depth) {
        const current = content[index++]
        if (current === '\\') {
          const escaped = content[index++]
          const control = { n: 10, r: 13, t: 9, b: 8, f: 12 }
          if (control[escaped] !== undefined) bytes.push(control[escaped])
          else if (/[0-7]/.test(escaped ?? '')) {
            let octal = escaped
            for (let count = 0; count < 2 && /[0-7]/.test(content[index] ?? ''); count++) octal += content[index++]
            bytes.push(Number.parseInt(octal, 8) & 255)
          } else if (escaped !== '\r' && escaped !== '\n') bytes.push((escaped ?? '').charCodeAt(0))
        } else if (current === '(') { depth++; bytes.push(40) }
        else if (current === ')') { depth--; if (depth) bytes.push(41) }
        else bytes.push(current.charCodeAt(0))
      }
      result.push({ type: 'string', bytes: Buffer.from(bytes) })
      continue
    }
    if (char === '<') {
      if (content[index + 1] === '<') { result.push({ type: 'operator', value: '<<' }); index += 2; continue }
      const end = content.indexOf('>', index + 1)
      if (end < 0) break
      let hex = content.slice(index + 1, end).replace(/\s/g, '')
      if (hex.length % 2) hex += '0'
      result.push({ type: 'string', bytes: Buffer.from(hex, 'hex') })
      index = end + 1
      continue
    }
    if (char === '[' || char === ']') { result.push({ type: 'operator', value: char }); index++; continue }
    let end = index + 1
    while (end < content.length && !/[\s\[\]()<>/%]/.test(content[end])) end++
    const value = content.slice(index, end)
    result.push({ type: value.startsWith('/') ? 'name' : /^[-+.\d]/.test(value) ? 'number' : 'operator', value: value.startsWith('/') ? value.slice(1) : value })
    index = end
  }
  return result
}

function extractTextFragments(content, fonts, cmaps) {
  const stack = []
  const arrays = []
  const output = []
  let fontName
  let matrix = [1, 0, 0, 1, 0, 0]
  const matrices = []
  let textX = 0
  let textY = 0

  const transformPoint = (x, y) => ({
    x: matrix[0] * x + matrix[2] * y + matrix[4],
    y: matrix[1] * x + matrix[3] * y + matrix[5],
  })

  for (const token of tokenize(content)) {
    if (token.type === 'operator' && token.value === 'Tf') {
      fontName = stack.at(-2)?.value
      stack.length = 0
    } else if (token.type === 'operator' && token.value === 'q') {
      matrices.push(matrix)
      stack.length = 0
    } else if (token.type === 'operator' && token.value === 'Q') {
      matrix = matrices.pop() ?? [1, 0, 0, 1, 0, 0]
      stack.length = 0
    } else if (token.type === 'operator' && token.value === 'cm') {
      const values = stack.slice(-6).map((value) => Number(value.value))
      if (values.length === 6 && values.every(Number.isFinite)) {
        const [a, b, c, d, e, f] = values
        const [ma, mb, mc, md, me, mf] = matrix
        matrix = [
          ma * a + mc * b,
          mb * a + md * b,
          ma * c + mc * d,
          mb * c + md * d,
          ma * e + mc * f + me,
          mb * e + md * f + mf,
        ]
      }
      stack.length = 0
    } else if (token.type === 'operator' && token.value === 'Tm') {
      const values = stack.slice(-6).map((value) => Number(value.value))
      if (values.length === 6 && values.every(Number.isFinite)) {
        textX = values[4]
        textY = values[5]
      }
      stack.length = 0
    } else if (token.type === 'operator' && token.value === 'Td') {
      const values = stack.slice(-2).map((value) => Number(value.value))
      if (values.length === 2 && values.every(Number.isFinite)) {
        textX += values[0]
        textY += values[1]
      }
      stack.length = 0
    } else if (token.type === 'operator' && ['Tj', 'TJ', "'", '"'].includes(token.value)) {
      const operand = stack.at(-1)
      const strings = operand?.type === 'array'
        ? operand.value.filter((item) => item.type === 'string')
        : operand?.type === 'string' ? [operand] : []
      const text = strings.map((item) => decode(item.bytes, fontName, fonts, cmaps)).join('')
      if (text.trim()) output.push({ text, ...transformPoint(textX, textY), fontName })
      stack.length = 0
    } else if (token.type === 'operator' && token.value === '[') arrays.push([])
    else if (token.type === 'operator' && token.value === ']') {
      const array = { type: 'array', value: arrays.pop() ?? [] }
      if (arrays.length) arrays.at(-1).push(array)
      else stack.push(array)
    } else if (arrays.length) arrays.at(-1).push(token)
    else stack.push(token)
    if (stack.length > 8) stack.shift()
  }
  return output
}

function extractText(content, fonts, cmaps) {
  return extractTextFragments(content, fonts, cmaps)
    .map((fragment) => fragment.text)
    .join(' ')
    .replace(/\s+/g, ' ')
}

function references(value) {
  return [...value.matchAll(/(\d+)\s+\d+\s+R/g)].map((item) => Number(item[1]))
}

function getPages(objects) {
  const catalog = [...objects].find(([, body]) => /\/Type\s*\/Catalog\b/.test(body))?.[1] ?? ''
  const root = Number(catalog.match(/\/Pages\s+(\d+)\s+\d+\s+R/)?.[1])
  const pages = []
  function walk(id) {
    const body = objects.get(id) ?? ''
    if (/\/Type\s*\/Page\b/.test(body) && !/\/Type\s*\/Pages\b/.test(body)) { pages.push([id, body]); return }
    const kids = body.match(/\/Kids\s*\[([\s\S]*?)\]/)?.[1] ?? ''
    for (const child of references(kids)) walk(child)
  }
  if (root) walk(root)
  return pages
}

const ROOT = path.resolve(__dirname, '..')
const PROCESSED_DIRECTORY = path.join(ROOT, 'data', 'processed')
const METADATA_DIRECTORY = path.join(ROOT, 'data', 'metadata')
const DISTRICT_METADATA_PATH = path.join(
  ROOT,
  'src',
  'features',
  'district-profile',
  'data',
  'districtMetadata.ts',
)

const DATASETS = [
  {
    id: 'SAS 2024',
    path: path.join(ROOT, 'data', 'raw', 'SAS', 'SAS 2024 Annual.pdf'),
    report: 'Seasonal Agricultural Survey, Annual Report 2024',
    reportYear: 2024,
    agriculturalYear: '2023/24',
    sourceUrl: 'https://www.statistics.gov.rw/sites/default/files/documents/2025-02/SAS%202024%20Annual.pdf',
  },
  {
    id: 'SAS 2025',
    path: path.join(ROOT, 'data', 'raw', 'SAS', 'SAS 2025 Final report.pdf'),
    report: 'Seasonal Agricultural Survey, Annual Report, December 2025',
    reportYear: 2025,
    agriculturalYear: '2024/25',
    sourceUrl: 'https://www.statistics.gov.rw/sites/default/files/documents/2025-12/SAS%202025%20Final%20report.pdf',
  },
  {
    id: 'AHS 2024',
    path: path.join(ROOT, 'data', 'raw', 'AHS', 'AHS 2024_Main report.pdf'),
    report: 'Agricultural Household Survey 2024 Main Report',
    reportYear: 2024,
    agriculturalYear: '2023/24',
    sourceUrl: 'https://www.statistics.gov.rw/sites/default/files/documents/2025-10/AHS%202024_Main%20report.pdf',
  },
]

const SAS_CROPS_2024 = [
  'Maize', 'Sorghum', 'Paddy rice', 'Wheat', 'Other cereals', 'Cassava',
  'Sweet potatoes', 'Irish potatoes', 'Yams & Taro', 'Bananas',
  'Cooking Banana', 'Dessert banana', 'Banana for beer', 'Beans',
  'Bush bean', 'Climbing bean', 'Peas', 'Ground nuts', 'Soya beans',
  'Vegetables', 'Fruits', 'Fodder crops', 'Other crops',
]

const SAS_CROPS_2025 = [
  'Maize', 'Sorghum', 'Paddy rice', 'Wheat', 'Other Cereals', 'Cassava',
  'Sweet potatoes', 'Irish potatoes', 'Yams & Taro', 'Banana',
  'Cooking banana', 'Dessert banana', 'Banana for beer', 'Beans',
  'Bush bean', 'Climbing bean', 'Pea', 'Ground nuts', 'Soya bean',
  'Vegetables', 'Fruits', 'Fodder Crops', 'Other crops',
]

const CROP_MATCH_NAMES = new Map([
  ['other cereals', 'Other cereals'],
  ['sweet potatoes', 'Sweet potatoes'],
  ['irish potatoes', 'Irish potatoes'],
  ['yams & taro', 'Yams & Taro'],
  ['bananas', 'Bananas'],
  ['banana', 'Bananas'],
  ['cooking banana', 'Cooking banana'],
  ['dessert banana', 'Dessert banana'],
  ['banana for beer', 'Banana for beer'],
  ['peas', 'Peas'],
  ['pea', 'Peas'],
  ['ground nuts', 'Ground nuts'],
  ['soya beans', 'Soya beans'],
  ['soya bean', 'Soya beans'],
  ['soybean', 'Soya beans'],
  ['bean', 'Beans'],
  ['fodder crops', 'Fodder crops'],
  ['sweet potato', 'Sweet potatoes'],
  ['irish potato', 'Irish potatoes'],
  ['groundnut', 'Ground nuts'],
  ['vegetables', 'Vegetables'],
])

function cropMatchName(sourceCrop) {
  const normalized = sourceCrop.trim().toLowerCase()
  return CROP_MATCH_NAMES.get(normalized) ?? sourceCrop.trim()
}

const INDICATORS = {
  average_yield: { label: 'Average crop yield', unit: 'Kg/Ha' },
  cultivated_area: { label: 'Cultivated crop area', unit: 'Ha' },
  crop_production: { label: 'Crop production', unit: 'MT' },
  improved_seed_use: { label: 'Farmers who used improved seeds', unit: '%' },
  organic_fertilizer_use: { label: 'Farmers who applied organic fertilizer', unit: '%' },
  inorganic_fertilizer_use: { label: 'Farmers who used inorganic fertilizer', unit: '%' },
  pesticide_use: { label: 'Farmers who used pesticides', unit: '%' },
  irrigation_practice: { label: 'Farmers who practiced irrigation', unit: '%' },
  erosion_control_practice: { label: 'Farmers who protected land against erosion', unit: '%' },
  mechanical_equipment_use: { label: 'Farmers who used mechanical equipment', unit: '%' },
  agroforestry_practice: { label: 'Farmers who practiced agroforestry', unit: '%' },
  agricultural_association_membership: { label: 'Agricultural association membership', unit: '%' },
  agricultural_extension_use: { label: 'Agricultural extension access', unit: '%' },
  kitchen_garden_use: { label: 'Households with kitchen gardens', unit: '%' },
  fertilizer_risk_awareness: { label: 'Awareness of fertilizer environmental risks', unit: '%' },
  pesticide_risk_awareness: { label: 'Awareness of pesticide environmental and health risks', unit: '%' },
  livestock_ownership: { label: 'Livestock ownership among households rearing livestock', unit: '%' },
  beekeeping: { label: 'Households practicing beekeeping', unit: '%' },
}

const PRODUCT_TABLES = {
  'SAS 2024': [
    { table: 10, season: 'A', indicator: 'cultivated_area', unit: 'Ha', crops: SAS_CROPS_2024 },
    { table: 11, season: 'B', indicator: 'cultivated_area', unit: 'Ha', crops: SAS_CROPS_2024 },
    { table: 12, season: 'C', indicator: 'cultivated_area', unit: 'Ha', crops: SAS_CROPS_2024 },
    { table: 16, season: 'A', indicator: 'average_yield', unit: 'Kg/Ha', crops: SAS_CROPS_2024 },
    { table: 17, season: 'B', indicator: 'average_yield', unit: 'Kg/Ha', crops: SAS_CROPS_2024 },
    { table: 18, season: 'C', indicator: 'average_yield', unit: 'Kg/Ha', crops: SAS_CROPS_2024 },
    { table: 21, season: 'A', indicator: 'crop_production', unit: 'MT', crops: SAS_CROPS_2024 },
    { table: 22, season: 'B', indicator: 'crop_production', unit: 'MT', crops: SAS_CROPS_2024 },
    { table: 23, season: 'C', indicator: 'crop_production', unit: 'MT', crops: SAS_CROPS_2024 },
  ],
  'SAS 2025': [
    { table: 13, season: 'A', indicator: 'cultivated_area', unit: 'Ha', crops: SAS_CROPS_2025 },
    { table: 14, season: 'B', indicator: 'cultivated_area', unit: 'Ha', crops: SAS_CROPS_2025 },
    { table: 15, season: 'C', indicator: 'cultivated_area', unit: 'Ha', crops: SAS_CROPS_2025 },
    { table: 19, season: 'A', indicator: 'average_yield', unit: 'Kg/Ha', crops: SAS_CROPS_2025 },
    { table: 20, season: 'B', indicator: 'average_yield', unit: 'Kg/Ha', crops: SAS_CROPS_2025 },
    { table: 21, season: 'C', indicator: 'average_yield', unit: 'Kg/Ha', crops: SAS_CROPS_2025 },
    { table: 24, season: 'A', indicator: 'crop_production', unit: 'MT', crops: SAS_CROPS_2025 },
    { table: 25, season: 'B', indicator: 'crop_production', unit: 'MT', crops: SAS_CROPS_2025 },
    { table: 26, season: 'C', indicator: 'crop_production', unit: 'MT', crops: SAS_CROPS_2025 },
  ],
}

const DISTRICT_PRACTICE_TABLES = {
  'SAS 2024': [61, 62, 63],
  'SAS 2025': [64, 65, 66],
}

const INPUT_TABLES = {
  'SAS 2024': [
    { tables: [30, 31, 32], indicator: 'improved_seed_use' },
    { tables: [40, 41, 42], indicator: 'organic_fertilizer_use' },
    { tables: [43, 44, 45], indicator: 'inorganic_fertilizer_use' },
    { tables: [55, 56, 57], indicator: 'pesticide_use' },
  ],
  'SAS 2025': [
    { tables: [33, 34, 35], indicator: 'improved_seed_use' },
    { tables: [43, 44, 45], indicator: 'organic_fertilizer_use' },
    { tables: [46, 47, 48], indicator: 'inorganic_fertilizer_use' },
    { tables: [58, 59, 60], indicator: 'pesticide_use' },
  ],
}

const AHS_SUMMARY = [
  { row: 12, label: 'Percentage of agricultural households who used improved seeds', indicator: 'improved_seed_use', kind: 'trend' },
  { row: 13, label: 'Percentage of agricultural households who used organic fertilizer', indicator: 'organic_fertilizer_use', kind: 'trend' },
  { row: 14, label: 'Percentage of agricultural households who used inorganic fertilizer', indicator: 'inorganic_fertilizer_use', kind: 'trend' },
  { row: 15, label: 'Percentage of agricultural households who used pesticides', indicator: 'pesticide_use', kind: 'trend' },
  { row: 16, label: 'Percentage of agricultural households who practice irrigation', indicator: 'irrigation_practice', kind: 'trend' },
  { row: 17, label: 'Percentage of agricultural households who practice erosion control measures', indicator: 'erosion_control_practice', kind: 'trend' },
  { row: 18, label: 'Percentage of agricultural households who planted agroforestry trees in their plots', indicator: 'agroforestry_practice', kind: 'unavailable' },
  { row: 19, label: 'Percentage of households who used mechanical equipment used in cultivation', indicator: 'mechanical_equipment_use', kind: 'unavailable' },
  { row: 20, label: 'Percentage of agricultural households with at least one member belongs to agricultural cooperative or association', indicator: 'agricultural_association_membership', kind: 'trend' },
  { row: 21, label: 'Percentage of agricultural households with at least one member received an agricultural extension', indicator: 'agricultural_extension_use', kind: 'unavailable' },
  { row: 22, label: 'Percentage of agricultural households who had a kitchen garden', indicator: 'kitchen_garden_use', kind: 'trend' },
  { row: 23, label: 'Percentage of agricultural households that are aware of environmental risks associated with the excessive use or misuse of inorganic fertilizers.', indicator: 'fertilizer_risk_awareness', kind: 'unavailable' },
  { row: 24, label: 'Percentage of agricultural households that are aware of the environmental and health risks associated with the use of pesticides', indicator: 'pesticide_risk_awareness', kind: 'unavailable' },
  { row: 25, label: 'Percentage of cattle owners out of total households rearing livestock', indicator: 'livestock_ownership', species: 'Cattle', kind: 'trend' },
  { row: 26, label: 'Percentage of goat owners out of total households rearing livestock', indicator: 'livestock_ownership', species: 'Goat', kind: 'trend' },
  { row: 27, label: 'Percentage of sheep owners out of total households rearing livestock', indicator: 'livestock_ownership', species: 'Sheep', kind: 'trend' },
  { row: 28, label: 'Percentage of pig owners out of total households rearing livestock', indicator: 'livestock_ownership', species: 'Pig', kind: 'trend' },
  { row: 29, label: 'Percentage of chicken owners out of total households rearing livestock', indicator: 'livestock_ownership', species: 'Chicken', kind: 'trend' },
  { row: 30, label: 'Percentage of rabbit owners out of total households rearing livestock', indicator: 'livestock_ownership', species: 'Rabbit', kind: 'trend' },
  { row: 31, label: 'Percentage of agricultural households who did bee keeping', indicator: 'beekeeping', kind: 'unavailable' },
]

const EXTRACTED_TABLES = new Map([
  ['SAS 2024', new Set([
    ...PRODUCT_TABLES['SAS 2024'].map((table) => table.table),
    ...INPUT_TABLES['SAS 2024'].flatMap((group) => group.tables),
    ...DISTRICT_PRACTICE_TABLES['SAS 2024'],
  ])],
  ['SAS 2025', new Set([
    ...PRODUCT_TABLES['SAS 2025'].map((table) => table.table),
    ...INPUT_TABLES['SAS 2025'].flatMap((group) => group.tables),
    ...DISTRICT_PRACTICE_TABLES['SAS 2025'],
  ])],
  ['AHS 2024', new Set([1])],
])

function slug(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function normalizeWhitespace(value) {
  return value
    .replace(/\bNationa\s+l\b/gi, 'National')
    .replace(/\bT\s+able\b/gi, 'Table')
    .replace(/\s+/g, ' ')
    .trim()
}

function sourceTableReference(table, title, page) {
  return { table: `Table ${table}: ${title}`, page }
}

function getPageLabel(text) {
  const match = text.match(/^\s*(\d+)\s+(?:Table|Figure|Map)\b/i)
  return match ? Number(match[1]) : undefined
}

function getReportPages(dataset) {
  const { objects, stream } = parseObjects(dataset.path)
  const pages = getPages(objects).map(([id, body]) => {
    let parentId = Number(body.match(/\/Parent\s+(\d+)\s+\d+\s+R/)?.[1])
    let resourceBody = body
    while (!/\/Font\s*<</.test(resourceBody) && parentId) {
      resourceBody = objects.get(parentId) ?? ''
      parentId = Number(resourceBody.match(/\/Parent\s+(\d+)\s+\d+\s+R/)?.[1])
    }
    const fonts = new Map()
    const fontDictionary = resourceBody.match(/\/Font\s*<<(.*?)>>/s)?.[1] ?? ''
    for (const font of fontDictionary.matchAll(/\/(\w+)\s+(\d+)\s+\d+\s+R/g)) {
      fonts.set(font[1], Number(font[2]))
    }
    const contents = body.match(/\/Contents\s+(\d+)\s+\d+\s+R/)?.[1]
    const content = contents ? stream(Number(contents)) : undefined
    const cmaps = new Map()
    cmaps.objects = objects
    cmaps.stream = stream
    const fragments = content
      ? extractTextFragments(content.toString('latin1'), fonts, cmaps)
      : []
    const text = normalizeWhitespace(fragments.map((fragment) => fragment.text).join(' '))
    return { id, text, fragments, printedPage: getPageLabel(text) }
  })
  if (!pages.some((page) => page.text.length > 0)) {
    throw new Error(`No text content could be extracted from ${dataset.path}`)
  }
  return pages
}

function getTablePage(pages, tableNumber) {
  const tablePattern = new RegExp(`\\bTable\\s+${tableNumber}\\s*:`,'i')
  const matches = pages.filter((page) =>
    tablePattern.test(page.text) && page.text.includes('Nyarugenge') && page.text.includes('National'),
  )
  if (matches.length !== 1) {
    throw new Error(`Expected one data page for Table ${tableNumber}; found ${matches.length}`)
  }
  return matches[0]
}

function parseNumericCells(text) {
  return [...text.matchAll(/(?:\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?|[-–—])/g)]
    .map((match) => match[0])
}

function extractRows(page, districts) {
  const headingIndex = page.text.search(/\bDistrict\b/)
  const firstRowIndex = page.text.indexOf('Nyarugenge', Math.max(0, headingIndex))
  if (firstRowIndex < 0) throw new Error('District table does not contain its first district row')

  const rowNames = [...districts, 'National', 'SSF', 'LSF']
  const rowPositions = rowNames
    .map((name) => ({ name, index: page.text.indexOf(name, firstRowIndex) }))
    .filter((item) => item.index >= firstRowIndex)
    .sort((first, second) => first.index - second.index)

  const rows = new Map()
  for (let index = 0; index < rowPositions.length; index++) {
    const current = rowPositions[index]
    if (current.name === 'SSF' || current.name === 'LSF') continue
    const nextIndex = rowPositions[index + 1]?.index ?? page.text.length
    const values = parseNumericCells(
      page.text.slice(current.index + current.name.length, nextIndex),
    )
    rows.set(current.name, values)
  }

  for (const district of districts) {
    if (!rows.has(district)) throw new Error(`Missing district row: ${district}`)
  }
  if (!rows.has('National')) throw new Error('Missing national row')
  return rows
}

function makeSource(dataset, reference) {
  return {
    kind: 'nisr',
    dataset: dataset.id,
    report: dataset.report,
    reportYear: dataset.reportYear,
    sourceUrl: dataset.sourceUrl,
    references: [reference],
  }
}

function makeRecord(dataset, details) {
  const geographySlug = slug(details.geography.name)
  const periodSlug = details.period.season?.toLowerCase() ?? 'annual'
  const cropSlug = details.crop ? `-${slug(details.crop)}` : ''
  const legacySas2025Id = dataset.id === 'SAS 2025' &&
    details.period.season === 'A' &&
    details.period.year === '2024/25' &&
    (!details.crop || details.crop.toLowerCase() === 'maize')
  const speciesSlug = details.species ? `-${slug(details.species)}` : ''
  const id = legacySas2025Id
    ? `sas-2025-season-a-${geographySlug}-${details.indicator}`
    : `${slug(dataset.id)}-${periodSlug}-${slug(details.period.year)}-${geographySlug}-${details.indicator}${cropSlug}${speciesSlug}`
  const sourceReference = details.sourceReference
  const value = details.value

  return {
    id,
    indicator: details.indicator,
    label: details.label,
    ...(details.crop ? { crop: details.crop, sourceCrop: details.sourceCrop ?? details.crop } : {}),
    ...(details.species ? { species: details.species } : {}),
    value,
    unit: details.unit,
    geography: {
      level: details.geography.level,
      id: geographySlug,
      name: details.geography.name,
    },
    period: {
      year: details.period.year,
      ...(details.period.season ? { season: details.period.season } : {}),
      ...(details.period.label ? { label: details.period.label } : {}),
    },
    dataset: dataset.id,
    source: makeSource(dataset, sourceReference),
    sourceReference,
    status: value === null ? 'unavailable' : 'observed',
  }
}

function addInventoryRecord(inventory, dataset, record) {
  inventory.push({
    dataset: record.dataset,
    report: dataset.report,
    table: record.sourceReference.table,
    indicator: record.label,
    ...(record.crop ? { crop: record.sourceCrop ?? record.crop } : {}),
    geographyLevel: record.geography.level,
    geography: record.geography.name,
    year: record.period.year,
    ...(record.period.season ? { season: record.period.season } : {}),
    unit: record.unit,
    available: record.status === 'observed',
    sourcePage: record.sourceReference.page,
    sourceTable: record.sourceReference.table,
    extractionStatus: record.status === 'observed' ? 'extracted' : 'unavailable',
    ...(record.status === 'unavailable' ? { notes: 'NISR does not report a value for this observation; none was imputed.' } : {}),
  })
}

function addTableCoverage(inventory, dataset, page) {
  const markers = [...page.text.matchAll(/\bTable\s+(\d+)\s*[:.]/gi)]
  for (let index = 0; index < markers.length; index++) {
    const marker = markers[index]
    const tableNumber = marker[1]
    if (Number(tableNumber) < 1) continue
    const segmentStart = marker.index + marker[0].length
    const segmentEnd = markers[index + 1]?.index ?? page.text.length
    const segment = normalizeWhitespace(
      page.text.slice(segmentStart, segmentEnd).split(/List of Tables/i)[0],
    ).replace(/\.{2,}[\s\S]*$/, '')
    const pageMatch = /\s+([ivxlcdm]+|\d+)\s*$/i.exec(segment)
    const pageLabel = pageMatch?.[1]
    const rawTitle = pageMatch
      ? segment.slice(0, pageMatch.index)
      : segment
    const romanPage = pageLabel && /^[ivxlcdm]+$/i.test(pageLabel)
      ? pageLabel
      : undefined
    const numericPage = pageLabel && /^\d+$/.test(pageLabel)
      ? pageLabel
      : undefined
    if (EXTRACTED_TABLES.get(dataset.id)?.has(Number(tableNumber))) continue
    const title = normalizeWhitespace(rawTitle.replace(/[.\s·…]+$/, ''))
    if (!title) continue
    const tableId = `${dataset.id}:${tableNumber}`
    if (inventory.some((record) => record._tableId === tableId)) continue
    const season = /\bSeason\s+([ABC])\b/i.exec(title)?.[1]?.toUpperCase()
    const geographyLevel = /\bdistrict\b/i.test(title)
      ? 'district'
      : /\bprovince\b/i.test(title)
        ? 'province'
        : 'other'
    const unit = /\((Kg\/Ha|MT|Ha|%|FRW\/?Ha)\)/i.exec(title)?.[1]
    inventory.push({
      _tableId: tableId,
      dataset: dataset.id,
      report: dataset.report,
      table: `Table ${tableNumber}: ${title}`,
      indicator: title,
      geographyLevel,
      year: dataset.agriculturalYear,
      ...(season ? { season } : {}),
      ...(unit ? { unit } : {}),
      available: true,
      ...(numericPage ? { sourcePage: Number(numericPage) } : {}),
      ...(romanPage ? { sourcePageLabel: romanPage } : {}),
      sourceTable: `Table ${tableNumber}: ${title}`,
      extractionStatus: 'catalogued_not_connected',
      notes: 'The report lists this table, but this extraction does not parse its cell values.',
    })
  }
}

function extractCatalog(inventory, dataset, pages) {
  const tocPages = pages.filter((page) =>
    /(?:Figures, Maps and Tables|List of Tables|MAPS, FIGURES AND TABLES)/i.test(page.text),
  )
  for (const page of tocPages) addTableCoverage(inventory, dataset, page)
}

function tableTitleFromPage(page, tableNumber) {
  const tableStart = page.text.search(new RegExp(`\\bTable\\s+${tableNumber}\\s*:`, 'i'))
  if (tableStart < 0) throw new Error(`Table ${tableNumber} caption is missing`)
  const titleStart = page.text.indexOf(':', tableStart) + 1
  const header = /\s+District\b/.exec(page.text.slice(titleStart))
  if (!header) throw new Error(`Table ${tableNumber} column header was not found`)
  return normalizeWhitespace(page.text.slice(titleStart, titleStart + header.index))
}

function extractCropHeaders(page, tableNumber) {
  const tableStart = page.text.search(new RegExp(`\\bTable\\s+${tableNumber}\\s*:`, 'i'))
  const districtHeader = page.text.indexOf('District', tableStart)
  const firstDataRow = page.text.indexOf('Nyarugenge', districtHeader)
  if (districtHeader < 0 || firstDataRow < districtHeader) {
    throw new Error(`Table ${tableNumber}: crop column header is missing`)
  }
  const header = page.text.slice(districtHeader + 'District'.length, firstDataRow)
  const configuredLabels = [
    ...SAS_CROPS_2024,
    ...SAS_CROPS_2025,
    'Sweet potato', 'Irish potato', 'Bean', 'Pea', 'Soybean', 'Groundnut',
  ]
  const labels = [...new Set(configuredLabels)].sort((first, second) => second.length - first.length)
  const matches = []
  for (const label of labels) {
    const pattern = new RegExp(`(?<![\\p{L}])${label.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}(?![\\p{L}])`, 'giu')
    for (const match of header.matchAll(pattern)) {
      matches.push({ start: match.index, end: match.index + match[0].length })
    }
  }
  matches.sort((first, second) => first.start - second.start || second.end - first.end)
  const selected = []
  for (const match of matches) {
    if (selected.some((existing) => match.start < existing.end && match.end > existing.start)) continue
    selected.push(match)
  }
  selected.sort((first, second) => first.start - second.start)
  const crops = selected.map((match) => {
    const sourceCrop = normalizeWhitespace(header.slice(match.start, match.end))
    return { sourceCrop, crop: cropMatchName(sourceCrop) }
  })
  if (!crops.length) throw new Error(`Table ${tableNumber}: no crop columns were recognized`)
  return crops
}

function extractProductTables(dataset, pages, districts, records, inventory) {
  for (const definition of PRODUCT_TABLES[dataset.id] ?? []) {
    const page = getTablePage(pages, definition.table)
    const rows = extractRows(page, districts)
    const crops = extractCropHeaders(page, definition.table)
    const expected = crops.length
    const sourceReference = sourceTableReference(
      definition.table,
      tableTitleFromPage(page, definition.table),
      page.printedPage,
    )

    for (const geographyName of [...districts, 'National']) {
      const values = rows.get(geographyName) ?? []
      if (values.length < expected) {
        throw new Error(`Table ${definition.table}, ${geographyName}: expected at least ${expected} crop cells, got ${values.length}`)
      }
      for (let cropIndex = 0; cropIndex < expected; cropIndex++) {
        const raw = values[cropIndex]
        const value = /^[-–—]$/.test(raw) ? null : Number(raw.replaceAll(',', ''))
        if (value !== null && !Number.isFinite(value)) {
          throw new Error(`Invalid numeric cell in Table ${definition.table}: ${raw}`)
        }
        const geography = geographyName === 'National'
          ? { level: 'national', name: 'Rwanda' }
          : { level: 'district', name: geographyName }
        const record = makeRecord(dataset, {
          indicator: definition.indicator,
          label: INDICATORS[definition.indicator].label,
          crop: crops[cropIndex].crop,
          sourceCrop: crops[cropIndex].sourceCrop,
          value,
          unit: definition.unit,
          geography,
          period: { year: dataset.agriculturalYear, season: definition.season },
          sourceReference,
        })
        records.push(record)
        addInventoryRecord(inventory, dataset, record)
      }
    }
  }
}

function cellValue(raw, tableNumber, district) {
  if (raw === undefined) throw new Error(`Table ${tableNumber}, ${district}: missing numeric cell`)
  if (/^[-–—]$/.test(raw)) return null
  const value = Number(raw.replaceAll(',', ''))
  if (!Number.isFinite(value)) throw new Error(`Table ${tableNumber}, ${district}: invalid value ${raw}`)
  return value
}

function extractInputTables(dataset, pages, districts, records, inventory) {
  for (const group of INPUT_TABLES[dataset.id] ?? []) {
    for (let seasonIndex = 0; seasonIndex < 3; seasonIndex++) {
      const tableNumber = group.tables[seasonIndex]
      const page = getTablePage(pages, tableNumber)
      const rows = extractRows(page, districts)
      const sourceReference = sourceTableReference(
        tableNumber,
        tableTitleFromPage(page, tableNumber),
        page.printedPage,
      )
      for (const geographyName of [...districts, 'National']) {
        const raw = rows.get(geographyName)?.[0]
        const value = cellValue(raw, tableNumber, geographyName)
        const geography = geographyName === 'National'
          ? { level: 'national', name: 'Rwanda' }
          : { level: 'district', name: geographyName }
        const record = makeRecord(dataset, {
          indicator: group.indicator,
          label: INDICATORS[group.indicator].label,
          value,
          unit: '%',
          geography,
          period: { year: dataset.agriculturalYear, season: ['A', 'B', 'C'][seasonIndex] },
          sourceReference,
        })
        records.push(record)
        addInventoryRecord(inventory, dataset, record)
      }
    }
  }
}

function pageFragmentsForTable(page, tableNumber) {
  const tableAt = page.text.search(new RegExp(`\\bTable\\s+${tableNumber}\\s*:`, 'i'))
  const dataAt = page.text.indexOf('Nyarugenge', tableAt)
  const fragmentTexts = page.fragments.map((fragment) => fragment.text)
  let offset = 0
  let firstDataFragment = 0
  for (; firstDataFragment < fragmentTexts.length; firstDataFragment++) {
    const nextOffset = offset + fragmentTexts[firstDataFragment].length + 1
    if (offset <= dataAt && nextOffset > dataAt) break
    offset = nextOffset
  }
  return page.fragments.slice(firstDataFragment)
}

function extractPracticeTables(dataset, pages, districts, records, inventory) {
  const tableNumbers = DISTRICT_PRACTICE_TABLES[dataset.id] ?? []
  for (let seasonIndex = 0; seasonIndex < tableNumbers.length; seasonIndex++) {
    const tableNumber = tableNumbers[seasonIndex]
    const page = getTablePage(pages, tableNumber)
    const sourceReference = sourceTableReference(
      tableNumber,
      tableTitleFromPage(page, tableNumber),
      page.printedPage,
    )
    const fragments = pageFragmentsForTable(page, tableNumber)
    const firstDistrict = fragments.find((fragment) => fragment.text.trim() === 'Nyarugenge')
    const headerFragments = page.fragments.filter((fragment) =>
      fragment.text.trim() === 'Overall' &&
      (!firstDistrict || fragment.y > firstDistrict.y),
    )
    const overallColumns = [...new Map(headerFragments.map((fragment) => [Math.round(fragment.x), fragment])).values()]
      .sort((first, second) => first.x - second.x)
    const hasFarmerTypeColumns = seasonIndex < 2
    if (hasFarmerTypeColumns && overallColumns.length !== 4) {
      throw new Error(`Table ${tableNumber}: expected four Overall columns, found ${overallColumns.length}`)
    }

    const tableRows = [...districts, 'National'].map((geographyName) => {
      const rowLabel = page.fragments.find((fragment) => fragment.text.trim() === geographyName)
      if (!rowLabel) throw new Error(`Table ${tableNumber}: missing row label ${geographyName}`)
      const rowFragments = fragments.filter((fragment) =>
        Math.abs(fragment.y - rowLabel.y) < 0.6 &&
        fragment.text.trim() !== geographyName,
      )
      const numericFragments = rowFragments.flatMap((fragment) => {
        const cell = fragment.text.trim().replace(/,/g, '')
        if (/^[-–—]$/.test(cell)) return [{ raw: cell, x: fragment.x }]
        if (/^\d+(?:\.\d+)?$/.test(cell)) return [{ raw: cell, x: fragment.x }]
        return []
      })
      return { geographyName, rowLabel, numericFragments }
    })

    const indicators = [
      'erosion_control_practice',
      'mechanical_equipment_use',
      'irrigation_practice',
      'agroforestry_practice',
    ]
    for (const row of tableRows) {
      if (row.numericFragments.length < 4) {
        throw new Error(`Table ${tableNumber}, ${row.geographyName}: expected four practice values, found ${row.numericFragments.length}`)
      }
      const selectedValues = hasFarmerTypeColumns
        ? overallColumns.map((column, columnIndex) => {
            const nextColumn = overallColumns[columnIndex + 1]
            const groupValues = row.numericFragments.filter((value) =>
              value.x >= column.x && (!nextColumn || value.x < nextColumn.x),
            )
            if (!groupValues.length) {
              throw new Error(`Table ${tableNumber}, ${row.geographyName}: Overall cell ${columnIndex + 1} is missing`)
            }
            return groupValues.reduce((best, value) =>
              Math.abs(value.x - column.x) < Math.abs(best.x - column.x) ? value : best,
            )
          })
        : [...row.numericFragments].sort((first, second) => first.x - second.x).slice(0, 4)
      for (let index = 0; index < indicators.length; index++) {
        const geography = row.geographyName === 'National'
          ? { level: 'national', name: 'Rwanda' }
          : { level: 'district', name: row.geographyName }
        const value = cellValue(selectedValues[index]?.raw, tableNumber, row.geographyName)
        const record = makeRecord(dataset, {
          indicator: indicators[index],
          label: INDICATORS[indicators[index]].label,
          value,
          unit: '%',
          geography,
          period: { year: dataset.agriculturalYear, season: ['A', 'B', 'C'][seasonIndex] },
          sourceReference,
        })
        records.push(record)
        addInventoryRecord(inventory, dataset, record)
      }
    }
  }
}

function extractAhsSummary(dataset, pages, records, inventory) {
  const page = pages.find((item) => /^\s*\d+ Table 1:\s*Summary of AHS 2024 results/i.test(item.text))
  if (!page) throw new Error('AHS 2024 Table 1 summary was not found')
  console.log('AHS Table 1 source header', JSON.stringify(page.text.slice(0, 1800)))
  console.log('AHS Table 1 fragments', JSON.stringify(page.fragments.slice(0, 45).map(({ text, x, y }) => ({ text, x, y }))))
  const table = sourceTableReference(1, 'Summary of AHS 2024 results', page.printedPage)
  for (const rowNumber of [12, 18, 19, 21, 23, 24, 31]) {
    const row = page.fragments.find((fragment) => new RegExp(`^\\s*${rowNumber}\\s`).test(fragment.text))
    if (row) console.log('AHS row fragments', rowNumber, JSON.stringify(page.fragments.filter((fragment) => Math.abs(fragment.y - row.y) < 0.8).map(({ text, x, y }) => ({ text: text.trim(), x, y }))))
  }
  const geography = { level: 'national', name: 'Rwanda' }
  const period = {
    year: dataset.agriculturalYear,
    label: 'AHS 2024 reference period; no SAS season is reported',
  }

  for (const summary of AHS_SUMMARY) {
    const next = AHS_SUMMARY.find((candidate) => candidate.row === summary.row + 1)
    const start = page.text.indexOf(`${summary.row} ${summary.label}`)
    if (start < 0) throw new Error(`AHS Table 1 row ${summary.row} is missing`)
    const end = next
      ? page.text.indexOf(`${next.row} ${next.label}`, start + 1)
      : page.text.indexOf('Source: NISR, AHS 2024', start)
    const rawValues = parseNumericCells(
      page.text.slice(
        start + summary.row.toString().length + summary.label.length,
        end < 0 ? undefined : end,
      ),
    )
    const selectedCell = rawValues.length >= 3
      ? rawValues[2]
      : rawValues.length === 1
        ? rawValues[0]
        : undefined
    if (selectedCell === undefined && summary.kind !== 'unavailable') {
      throw new Error(`AHS Table 1 row ${summary.row}: selected year cell is missing`)
    }
    const value = selectedCell === undefined
      ? null
      : cellValue(selectedCell, 1, summary.label)
    if (summary.kind === 'unavailable' && value !== null) {
      console.log('AHS unavailable row contains data', summary.row, JSON.stringify(rawValues), JSON.stringify(page.text.slice(start, end < 0 ? start + 600 : end)))
      throw new Error(`AHS Table 1 row ${summary.row}: source is not unavailable`)
    }
    const record = makeRecord(dataset, {
      indicator: summary.indicator,
      label: summary.label,
      ...(summary.species ? { species: summary.species } : {}),
      value,
      unit: '%',
      geography,
      period,
      sourceReference: table,
    })
    records.push(record)
    addInventoryRecord(inventory, dataset, record)
  }
}

function readDistrictNames() {
  const source = fs.readFileSync(DISTRICT_METADATA_PATH, 'utf8')
  const names = [...source.matchAll(/district:\s*'([^']+)'/g)].map((match) => match[1])
  if (names.length !== 30) throw new Error(`Expected 30 application districts; found ${names.length}`)
  return names
}

function validateRecords(records, districts) {
  const keys = new Set()
  const errors = []
  for (const record of records) {
    const required = [record.id, record.indicator, record.unit, record.dataset, record.sourceReference?.table, record.source?.sourceUrl]
    if (required.some((value) => typeof value !== 'string' || !value.trim())) errors.push(`Missing required record field: ${record.id}`)
    if (!Number.isInteger(record.source?.reportYear)) errors.push(`Missing report year: ${record.id}`)
    if (record.sourceReference?.page !== undefined && (!Number.isInteger(record.sourceReference.page) || record.sourceReference.page <= 0)) errors.push(`Invalid source page: ${record.id}`)
    if (record.value !== null && (!Number.isFinite(record.value) || record.value < 0)) errors.push(`Invalid numeric value: ${record.id}`)
    if (record.unit === '%' && record.value !== null && record.value > 100) errors.push(`Percentage over 100: ${record.id}`)
    if (record.status !== (record.value === null ? 'unavailable' : 'observed')) errors.push(`Status/value mismatch: ${record.id}`)
    if (record.geography.level === 'district' && !districts.includes(record.geography.name)) errors.push(`Unknown district: ${record.geography.name}`)
    if (record.geography.level === 'national' && record.geography.name !== 'Rwanda') errors.push(`Invalid national geography: ${record.geography.name}`)
    if (record.period.season && !['A', 'B', 'C'].includes(record.period.season)) errors.push(`Invalid season: ${record.id}`)
    if (!record.period.year || !/^\d{4}\/\d{2}$/.test(record.period.year)) errors.push(`Invalid agricultural year: ${record.id}`)
    if (!record.source?.sourceUrl.startsWith('https://')) errors.push(`Invalid NISR source URL: ${record.id}`)
    const key = [record.dataset, record.indicator, record.crop ?? '', record.species ?? '', record.geography.level, record.geography.id, record.period.year, record.period.season ?? ''].join('|')
    if (keys.has(key)) errors.push(`Duplicate observation key: ${key}`)
    keys.add(key)
  }
  if (errors.length) throw new Error(`Source data validation failed:\n${errors.join('\n')}`)
}

function main() {
  const districts = readDistrictNames()
  const records = []
  const inventory = []

  for (const dataset of DATASETS) {
    if (!fs.existsSync(dataset.path)) throw new Error(`Missing source report: ${dataset.path}`)
    const pages = getReportPages(dataset)
    extractCatalog(inventory, dataset, pages)
    if (dataset.id === 'AHS 2024') {
      extractAhsSummary(dataset, pages, records, inventory)
      continue
    }
    extractProductTables(dataset, pages, districts, records, inventory)
    extractInputTables(dataset, pages, districts, records, inventory)
    extractPracticeTables(dataset, pages, districts, records, inventory)
  }

  validateRecords(records, districts)
  const cleanInventory = inventory.map(({ _tableId, ...record }) => record)
  fs.mkdirSync(PROCESSED_DIRECTORY, { recursive: true })
  fs.mkdirSync(METADATA_DIRECTORY, { recursive: true })
  fs.writeFileSync(
    path.join(PROCESSED_DIRECTORY, 'agricultural-observations.json'),
    `${JSON.stringify(records, null, 2)}\n`,
  )
  fs.writeFileSync(
    path.join(PROCESSED_DIRECTORY, 'agricultural-data-inventory.json'),
    `${JSON.stringify(cleanInventory, null, 2)}\n`,
  )
  fs.writeFileSync(
    path.join(METADATA_DIRECTORY, 'sources.json'),
    `${JSON.stringify(DATASETS.map((dataset) => ({
      dataset: dataset.id,
      report: dataset.report,
      reportYear: dataset.reportYear,
      agriculturalYear: dataset.agriculturalYear,
      rawFile: path.relative(ROOT, dataset.path).replaceAll(path.sep, '/'),
      sourceUrl: dataset.sourceUrl,
      extraction: 'scripts/extract-nisr-agricultural-data.cjs',
    })), null, 2)}\n`,
  )

  const datasets = DATASETS.map((dataset) => {
    const dataRecords = records.filter((record) => record.dataset === dataset.id)
    return {
      dataset: dataset.id,
      observations: dataRecords.length,
      observed: dataRecords.filter((record) => record.status === 'observed').length,
      unavailable: dataRecords.filter((record) => record.status === 'unavailable').length,
      crops: new Set(dataRecords.flatMap((record) => record.crop ? [record.crop] : [])).size,
      districtObservations: dataRecords.filter((record) => record.geography.level === 'district').length,
      seasons: [...new Set(dataRecords.flatMap((record) => record.period.season ? [record.period.season] : []))],
    }
  })
  console.log(JSON.stringify({ datasets, inventoryRows: cleanInventory.length }, null, 2))
}

try {
  main()
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
}



