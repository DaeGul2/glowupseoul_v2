// Read-only catalog routes — backed by Sequelize models.
// Returns 503 if DB not configured (client should keep using mock until cutover).
import {
  Brand, Hospital, HospitalProcedure,
  Procedure, ProcedureCategory, Concern,
  ConcernProcedure, Mechanism,
  Device, ProcedureDevice,
  PublicFeedEntry, Op,
} from '../db/models.js';
import { hasDbConfig } from '../db/sequelize.js';

function guardDb(res) {
  if (hasDbConfig()) return true;
  res.status(503).json({ error: 'db not configured', detail: 'set DB_HOST / DB_PASSWORD in server/.env' });
  return false;
}

function wrap(fn) {
  return (req, res) => Promise.resolve(fn(req, res)).catch((e) => {
    console.error('[catalog]', e?.message || e);
    res.status(500).json({ error: 'query failed', detail: e?.message });
  });
}

export const categoriesHandler = wrap(async (req, res) => {
  if (!guardDb(res)) return;
  const categories = await ProcedureCategory.findAll({
    where: { is_active: true },
    order: [['display_order', 'ASC'], ['id', 'ASC']],
  });
  res.json({ categories });
});

export const concernsHandler = wrap(async (req, res) => {
  if (!guardDb(res)) return;
  const concerns = await Concern.findAll({
    where: { is_active: true },
    order: [['display_order', 'ASC'], ['id', 'ASC']],
  });
  res.json({ concerns });
});

export const proceduresHandler = wrap(async (req, res) => {
  if (!guardDb(res)) return;
  const { category, surgical, limit } = req.query;
  const where = { is_active: true, deleted_at: null };
  if (surgical === '1') where.is_surgical = true;
  if (surgical === '0') where.is_surgical = false;

  const include = [{ model: ProcedureCategory, as: 'category', attributes: ['slug', 'name_ko', 'name_en'] }];
  if (category) include[0].where = { slug: category };

  const procedures = await Procedure.findAll({
    where,
    include,
    order: [['id', 'ASC']],
    limit: Math.min(Number(limit) || 200, 500),
  });
  res.json({ procedures });
});

export const procedureDetailHandler = wrap(async (req, res) => {
  if (!guardDb(res)) return;
  const procedure = await Procedure.findOne({
    where: { slug: req.params.slug, is_active: true, deleted_at: null },
    include: [{ model: ProcedureCategory, as: 'category' }],
  });
  if (!procedure) return res.status(404).json({ error: 'not found' });

  const offerings = await HospitalProcedure.findAll({
    where: { procedure_id: procedure.id, offered: true },
    include: [{
      model: Hospital,
      as: 'hospital',
      where: { contract_status: 'active', is_active: true },
      attributes: ['id','slug','name_ko','name_en','city','district','thumbnail_url'],
    }],
    order: [['is_signature', 'DESC'], ['starting_price_krw', 'ASC']],
  });
  res.json({ procedure, offerings });
});

export const devicesHandler = wrap(async (req, res) => {
  if (!guardDb(res)) return;
  const { mechanism } = req.query;
  const where = { is_active: true, deleted_at: null };
  if (mechanism) where.mechanism_slug = mechanism;
  const devices = await Device.findAll({
    where,
    order: [['display_order', 'ASC'], ['id', 'ASC']],
  });
  res.json({ devices });
});

export const deviceDetailHandler = wrap(async (req, res) => {
  if (!guardDb(res)) return;
  const device = await Device.findOne({
    where: { slug: req.params.slug, is_active: true, deleted_at: null },
    include: [{ model: Mechanism, as: 'mechanism', attributes: ['slug', 'label_ko', 'label_en'] }],
  });
  if (!device) return res.status(404).json({ error: 'not found' });

  const links = await ProcedureDevice.findAll({
    where: { device_id: device.id },
    include: [{
      model: Procedure, as: 'procedure',
      where: { is_active: true, deleted_at: null },
      attributes: ['id','slug','name_ko','name_en','category_id','thumbnail_url'],
    }],
    order: [['relevance', 'ASC'], ['display_order', 'ASC']],
  });
  res.json({ device, procedures: links });
});

export const hospitalsHandler = wrap(async (req, res) => {
  if (!guardDb(res)) return;
  const { city, contract = 'active', limit } = req.query;
  const where = { is_active: true, deleted_at: null, contract_status: contract };
  if (city) where.city = city;

  const hospitals = await Hospital.findAll({
    where,
    include: [{ model: Brand, as: 'brand', attributes: ['slug', 'name_ko', 'specialization_depth', 'logo_url'] }],
    order: [['id', 'ASC']],
    limit: Math.min(Number(limit) || 200, 500),
  });
  res.json({ hospitals });
});

export const hospitalDetailHandler = wrap(async (req, res) => {
  if (!guardDb(res)) return;
  const hospital = await Hospital.findOne({
    where: { slug: req.params.slug, is_active: true, deleted_at: null },
    include: [{ model: Brand, as: 'brand' }],
  });
  if (!hospital) return res.status(404).json({ error: 'not found' });

  const offerings = await HospitalProcedure.findAll({
    where: { hospital_id: hospital.id, offered: true },
    include: [{ model: Procedure, as: 'procedure', attributes: ['slug', 'name_ko', 'name_en', 'domain'] }],
    order: [['is_signature', 'DESC'], ['id', 'ASC']],
  });
  res.json({ hospital, offerings });
});

// Bootstrap — single round-trip on app boot. Returns every collection the
// client needs to render the catalog (categories, concerns, procedures,
// brands, hospitals, hospital_procedures, concern_procedures). Public-feed
// has its own endpoint (different access pattern).
export const bootstrapHandler = wrap(async (req, res) => {
  if (!guardDb(res)) return;

  const [
    mechanisms,
    categories,
    concerns,
    procedures,
    brands,
    hospitals,
    hospital_procedures,
    concern_procedures,
    devices,
    procedure_devices,
  ] = await Promise.all([
    Mechanism.findAll({
      where: { is_active: true },
      order: [['display_order', 'ASC']],
    }),
    ProcedureCategory.findAll({
      where: { is_active: true },
      order: [['display_order', 'ASC'], ['id', 'ASC']],
    }),
    Concern.findAll({
      where: { is_active: true },
      order: [['display_order', 'ASC'], ['id', 'ASC']],
    }),
    Procedure.findAll({
      where: { is_active: true, deleted_at: null },
      order: [['id', 'ASC']],
    }),
    Brand.findAll({
      where: { is_active: true, deleted_at: null },
      order: [['id', 'ASC']],
    }),
    Hospital.findAll({
      where: { is_active: true, deleted_at: null, contract_status: 'active' },
      order: [['id', 'ASC']],
    }),
    HospitalProcedure.findAll({
      where: { offered: true },
      order: [['id', 'ASC']],
    }),
    ConcernProcedure.findAll({
      order: [['concern_id', 'ASC'], ['procedure_id', 'ASC']],
    }),
    Device.findAll({
      where: { is_active: true, deleted_at: null },
      order: [['display_order', 'ASC'], ['id', 'ASC']],
    }),
    ProcedureDevice.findAll({
      order: [['procedure_id', 'ASC'], ['relevance', 'ASC'], ['display_order', 'ASC']],
    }),
  ]);

  res.set('Cache-Control', 'no-store');
  res.json({
    mechanisms,
    categories,
    concerns,
    procedures,
    brands,
    hospitals,
    hospital_procedures,
    concern_procedures,
    devices,
    procedure_devices,
    counts: {
      mechanisms: mechanisms.length,
      categories: categories.length,
      concerns: concerns.length,
      procedures: procedures.length,
      brands: brands.length,
      hospitals: hospitals.length,
      hospital_procedures: hospital_procedures.length,
      concern_procedures: concern_procedures.length,
      devices: devices.length,
      procedure_devices: procedure_devices.length,
    },
  });
});

export const feedRecentHandler = wrap(async (req, res) => {
  if (!guardDb(res)) return;
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const entries = await PublicFeedEntry.findAll({
    where: {
      is_visible: true,
      [Op.or]: [{ expires_at: null }, { expires_at: { [Op.gt]: new Date() } }],
    },
    order: [['priority', 'DESC'], ['displayed_at', 'DESC']],
    limit,
  });
  res.json({ entries });
});
