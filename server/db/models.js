// All Sequelize models in one file. Schema mirrors db/schema.mysql.sql.
// Validations (isIn, etc.) duplicate the CHECK constraints from SQL — both
// layers enforce, app layer gets nicer errors.
import { DataTypes, Op } from 'sequelize';
import { getSequelize } from './sequelize.js';

const sequelize = getSequelize();

const DOMAIN_VALUES = ['face_aesthetic','body_contouring','regenerative','surgical','derm_medical','dental'];
const INTENSITY_VALUES = ['subtle','moderate','dramatic'];
const ANESTHESIA_VALUES = ['topical','local','sedation','general','none'];
const UNIT_TYPE_VALUES = ['shots','cc','sessions','area','flat'];
const ONSET_VALUES = ['immediate','gradual'];
const DURATION_VALUES = ['temporary','months','years','permanent'];
const CONTRACT_VALUES = ['active','pending','negotiating','declined','paused'];
const RELEVANCE_VALUES = ['primary','secondary','adjunct'];
const SPECIALIZATION_VALUES = ['niche','device_led','general'];
const BUDGET_TIER_VALUES = ['under_300','300_800','800_2000','2000_5000','over_5000','flexible'];
const PAIN_VALUES = ['low','medium','high'];
const INTENSITY_PREF_VALUES = ['subtle','moderate','dramatic','any'];
const TRIP_STATUS_VALUES = ['planning','booked','in_progress','completed','cancelled'];
const INQUIRY_STATUS_VALUES = ['sent','quoted','declined','booked','expired'];
const CONSULT_PHASE_VALUES = ['pre_trip','in_trip','post_trip'];
const FEED_SOURCE_VALUES = ['inquiry','match_request','seed'];
const FEED_OUTCOME_VALUES = ['consulted','matched','quoted','booked','completed'];
const PRICE_TIER_VALUES = ['$','$$','$$$','$$$$'];

// -------------------------------------------------------------------
// Lookup tables
// -------------------------------------------------------------------
export const Mechanism = sequelize.define('Mechanism', {
  slug:           { type: DataTypes.STRING(64), primaryKey: true },
  label_ko:       { type: DataTypes.STRING(120), allowNull: false },
  label_en:       { type: DataTypes.STRING(120), allowNull: false },
  label_zh:       DataTypes.STRING(120),
  label_ja:       DataTypes.STRING(120),
  description_ko: DataTypes.TEXT,
  description_en: DataTypes.TEXT,
  description_zh: DataTypes.TEXT,
  description_ja: DataTypes.TEXT,
  domain:         { type: DataTypes.STRING(32), allowNull: false, validate: { isIn: [DOMAIN_VALUES] } },
  display_order:  DataTypes.SMALLINT,
  is_active:      { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, { tableName: 'mechanisms' });

export const ProcedureCategory = sequelize.define('ProcedureCategory', {
  id:             { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  slug:           { type: DataTypes.STRING(64), allowNull: false, unique: true },
  name_ko:        { type: DataTypes.STRING(120), allowNull: false },
  name_en:        { type: DataTypes.STRING(120), allowNull: false },
  name_zh:        DataTypes.STRING(120),
  name_ja:        DataTypes.STRING(120),
  domain:         { type: DataTypes.STRING(32), allowNull: false, validate: { isIn: [DOMAIN_VALUES] } },
  parent_id:      DataTypes.INTEGER,
  display_order:  DataTypes.SMALLINT,
  thumbnail_url:  DataTypes.TEXT,
  hero_image_url: DataTypes.TEXT,
  is_active:      { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, { tableName: 'procedure_categories' });

// -------------------------------------------------------------------
// Catalog core
// -------------------------------------------------------------------
export const Procedure = sequelize.define('Procedure', {
  id:                   { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  slug:                 { type: DataTypes.STRING(80), allowNull: false, unique: true },
  category_id:          DataTypes.INTEGER,

  name_ko:              { type: DataTypes.STRING(160), allowNull: false },
  name_en:              DataTypes.STRING(160),
  name_zh:              DataTypes.STRING(160),
  name_ja:              DataTypes.STRING(160),
  description_ko:       DataTypes.TEXT,
  description_en:       DataTypes.TEXT,
  description_zh:       DataTypes.TEXT,
  description_ja:       DataTypes.TEXT,

  mechanism:            { type: DataTypes.JSON, allowNull: false },
  domain:               { type: DataTypes.STRING(32), allowNull: false, validate: { isIn: [DOMAIN_VALUES] } },
  body_area:            { type: DataTypes.JSON, allowNull: false },

  pain_level:           { type: DataTypes.SMALLINT, validate: { min: 1, max: 5 } },
  intensity:            { type: DataTypes.STRING(16), validate: { isIn: [INTENSITY_VALUES.concat([null])] } },
  downtime_days:        DataTypes.SMALLINT,
  result_onset:         { type: DataTypes.STRING(16), validate: { isIn: [ONSET_VALUES.concat([null])] } },
  result_duration:      { type: DataTypes.STRING(16), validate: { isIn: [DURATION_VALUES.concat([null])] } },
  typical_sessions:     DataTypes.SMALLINT,

  is_surgical:          { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  anesthesia_typical:   { type: DataTypes.STRING(16), validate: { isIn: [ANESTHESIA_VALUES.concat([null])] } },
  op_duration_hours:    DataTypes.DECIMAL(3, 1),
  hospitalization_days: DataTypes.SMALLINT,
  stitch_removal_days:  DataTypes.SMALLINT,
  swelling_peak_days:   DataTypes.SMALLINT,
  final_result_weeks:   DataTypes.SMALLINT,
  revision_eligible:    DataTypes.BOOLEAN,

  market_price_min:     DataTypes.INTEGER,
  market_price_max:     DataTypes.INTEGER,
  price_unit:           DataTypes.STRING(32),
  unit_type:            { type: DataTypes.STRING(16), validate: { isIn: [UNIT_TYPE_VALUES.concat([null])] } },
  common_units:         DataTypes.JSON,

  device_examples:      DataTypes.JSON,

  thumbnail_url:        DataTypes.TEXT,
  hero_image_url:       DataTypes.TEXT,
  gallery_urls:         DataTypes.JSON,
  illustration_url:     DataTypes.TEXT,

  tags:                 DataTypes.JSON,

  is_active:            { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  deleted_at:           DataTypes.DATE,
}, { tableName: 'procedures' });

export const Concern = sequelize.define('Concern', {
  id:             { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  slug:           { type: DataTypes.STRING(64), allowNull: false, unique: true },
  name_ko:        { type: DataTypes.STRING(120), allowNull: false },
  name_en:        { type: DataTypes.STRING(120), allowNull: false },
  name_zh:        DataTypes.STRING(120),
  name_ja:        DataTypes.STRING(120),
  description_ko: DataTypes.TEXT,
  description_en: DataTypes.TEXT,
  description_zh: DataTypes.TEXT,
  description_ja: DataTypes.TEXT,
  body_area:      { type: DataTypes.STRING(32), allowNull: false },
  display_order:  DataTypes.SMALLINT,
  is_active:      { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, { tableName: 'concerns' });

export const ConcernProcedure = sequelize.define('ConcernProcedure', {
  concern_id:    { type: DataTypes.INTEGER, primaryKey: true },
  procedure_id:  { type: DataTypes.INTEGER, primaryKey: true },
  relevance:     { type: DataTypes.STRING(16), allowNull: false, validate: { isIn: [RELEVANCE_VALUES] } },
  rationale_ko:  DataTypes.TEXT,
  rationale_en:  DataTypes.TEXT,
  rationale_zh:  DataTypes.TEXT,
  rationale_ja:  DataTypes.TEXT,
}, { tableName: 'concern_procedures' });

// -------------------------------------------------------------------
// Brands & hospitals
// -------------------------------------------------------------------
export const Brand = sequelize.define('Brand', {
  id:                    { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  slug:                  { type: DataTypes.STRING(80), allowNull: false, unique: true },
  name_ko:               { type: DataTypes.STRING(160), allowNull: false },
  name_en:               DataTypes.STRING(160),
  name_zh:               DataTypes.STRING(160),
  name_ja:               DataTypes.STRING(160),
  founding_doctor:       DataTypes.STRING(120),
  specialization_depth:  { type: DataTypes.STRING(16), validate: { isIn: [SPECIALIZATION_VALUES.concat([null])] } },
  is_chain:              { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  website_url:           DataTypes.TEXT,
  logo_url:              DataTypes.TEXT,
  brand_hero_url:        DataTypes.TEXT,
  description_ko:        DataTypes.TEXT,
  description_en:        DataTypes.TEXT,
  description_zh:        DataTypes.TEXT,
  description_ja:        DataTypes.TEXT,
  is_active:             { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  deleted_at:            DataTypes.DATE,
}, { tableName: 'brands' });

export const Hospital = sequelize.define('Hospital', {
  id:                          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  slug:                        { type: DataTypes.STRING(120), allowNull: false, unique: true },
  brand_id:                    DataTypes.INTEGER,
  branch_name:                 DataTypes.STRING(120),

  name_ko:                     { type: DataTypes.STRING(200), allowNull: false },
  name_en:                     DataTypes.STRING(200),
  name_zh:                     DataTypes.STRING(200),
  name_ja:                     DataTypes.STRING(200),

  country:                     { type: DataTypes.STRING(8), allowNull: false, defaultValue: 'KR' },
  city:                        { type: DataTypes.STRING(64), allowNull: false },
  district:                    { type: DataTypes.STRING(64), allowNull: false },
  neighborhood:                DataTypes.STRING(64),
  full_address_ko:             DataTypes.TEXT,
  full_address_en:             DataTypes.TEXT,
  lat:                         DataTypes.DECIMAL(10, 8),
  lng:                         DataTypes.DECIMAL(11, 8),

  phone:                       DataTypes.STRING(40),
  email:                       DataTypes.STRING(160),
  kakao_id:                    DataTypes.STRING(80),
  wechat_id:                   DataTypes.STRING(80),
  whatsapp:                    DataTypes.STRING(40),
  line_id:                     DataTypes.STRING(80),
  website_url:                 DataTypes.TEXT,

  languages_supported:         { type: DataTypes.JSON, allowNull: false },

  has_intl_coordinator:        { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  has_interpreter:             { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  interpreter_languages:       DataTypes.JSON,
  english_doctor:              { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  female_doctor_available:     { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  accepts_foreign_card:        { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  airport_pickup:              { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  recovery_lodging_partner:    { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  halal_friendly:              { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  private_room_available:      { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  anesthesiologist_onsite:     { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },

  ba_gallery_url:              DataTypes.TEXT,
  ba_photo_count:              DataTypes.INTEGER,
  doctor_profile_url:          DataTypes.TEXT,
  safety_claim:                DataTypes.TEXT,
  foreign_case_volume_monthly: DataTypes.INTEGER,
  established_year:            DataTypes.SMALLINT,
  external_review_links:       DataTypes.JSON,

  thumbnail_url:               DataTypes.TEXT,
  hero_image_url:              DataTypes.TEXT,
  gallery_urls:                DataTypes.JSON,
  thumbnail_alt_ko:            DataTypes.STRING(255),
  thumbnail_alt_en:            DataTypes.STRING(255),

  contract_status:             { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'pending', validate: { isIn: [CONTRACT_VALUES] } },
  commission_pct:              DataTypes.DECIMAL(5, 2),
  notes:                       DataTypes.TEXT,

  is_active:                   { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  deleted_at:                  DataTypes.DATE,
}, { tableName: 'hospitals' });

export const HospitalProcedure = sequelize.define('HospitalProcedure', {
  id:                  { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  hospital_id:         { type: DataTypes.INTEGER, allowNull: false },
  procedure_id:        { type: DataTypes.INTEGER, allowNull: false },
  offered:             { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },

  local_name_ko:       DataTypes.STRING(200),
  local_name_en:       DataTypes.STRING(200),
  local_name_zh:       DataTypes.STRING(200),
  local_name_ja:       DataTypes.STRING(200),

  price_tier:          { type: DataTypes.STRING(8), validate: { isIn: [PRICE_TIER_VALUES.concat([null])] } },
  price_disclosed:     { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  starting_price_krw:  DataTypes.INTEGER,
  pricing_notes:       DataTypes.TEXT,
  available_units:     DataTypes.JSON,

  has_active_event:    { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  event_notes:         DataTypes.TEXT,
  event_until:         DataTypes.DATEONLY,

  package_notes:       DataTypes.TEXT,

  device_brands:       DataTypes.JSON,
  doctor_specialty:    DataTypes.STRING(200),
  years_offering:      DataTypes.SMALLINT,
  is_signature:        { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },

  thumbnail_url:       DataTypes.TEXT,
  hero_image_url:      DataTypes.TEXT,

  source_url:          DataTypes.TEXT,
  notes:               DataTypes.TEXT,
}, {
  tableName: 'hospital_procedures',
  indexes: [{ unique: true, fields: ['hospital_id', 'procedure_id'] }],
});

// -------------------------------------------------------------------
// Patients & flow
// -------------------------------------------------------------------
export const User = sequelize.define('User', {
  id:                  { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  email:               { type: DataTypes.STRING(255), unique: true },
  phone:               DataTypes.STRING(40),
  full_name:           DataTypes.STRING(160),
  display_name:        DataTypes.STRING(160),
  preferred_language:  { type: DataTypes.STRING(8), allowNull: false, defaultValue: 'en' },
  country_code:        DataTypes.STRING(8),

  wechat_id:           DataTypes.STRING(80),
  whatsapp:            DataTypes.STRING(40),
  line_id:             DataTypes.STRING(80),
  kakao_id:            DataTypes.STRING(80),

  auth_provider:       DataTypes.STRING(32),
  auth_provider_uid:   DataTypes.STRING(160),
  password_hash:       DataTypes.STRING(255),
  email_verified_at:   DataTypes.DATE,

  acquisition_channel: DataTypes.STRING(64),
  acquisition_meta:    DataTypes.JSON,

  is_active:           { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  deleted_at:          DataTypes.DATE,
}, { tableName: 'users' });

export const MatchRequest = sequelize.define('MatchRequest', {
  id:                   { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  user_id:              DataTypes.UUID,
  session_token:        DataTypes.STRING(120),

  concern_ids:          { type: DataTypes.JSON, allowNull: false },
  budget_tier:          { type: DataTypes.STRING(16), validate: { isIn: [BUDGET_TIER_VALUES.concat([null])] } },
  budget_min_krw:       DataTypes.INTEGER,
  budget_max_krw:       DataTypes.INTEGER,

  pain_tolerance:       { type: DataTypes.STRING(8), validate: { isIn: [PAIN_VALUES.concat([null])] } },
  intensity_pref:       { type: DataTypes.STRING(16), validate: { isIn: [INTENSITY_PREF_VALUES.concat([null])] } },
  max_downtime_days:    DataTypes.SMALLINT,
  preferred_languages:  DataTypes.JSON,
  district_pref:        DataTypes.STRING(64),
  city_pref:            DataTypes.STRING(64),
  trip_start:           DataTypes.DATEONLY,
  trip_end:             DataTypes.DATEONLY,
  prior_procedures:     DataTypes.JSON,
  notes:                DataTypes.TEXT,

  matched_at:           DataTypes.DATE,
  match_result:         DataTypes.JSON,

  public_feed_consent:  { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, {
  tableName: 'match_requests',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

export const Inquiry = sequelize.define('Inquiry', {
  id:                   { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  match_request_id:     DataTypes.UUID,
  user_id:              DataTypes.UUID,
  hospital_id:          { type: DataTypes.INTEGER, allowNull: false },
  procedure_id:         { type: DataTypes.INTEGER, allowNull: false },
  status:               { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'sent', validate: { isIn: [INQUIRY_STATUS_VALUES] } },
  channel:              DataTypes.STRING(16),
  user_message:         DataTypes.TEXT,
  hospital_response_ko: DataTypes.TEXT,
  notes:                DataTypes.TEXT,
  public_feed_consent:  { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, { tableName: 'inquiries' });

export const Quote = sequelize.define('Quote', {
  id:                   { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  inquiry_id:           { type: DataTypes.UUID, allowNull: false },
  quoted_price_krw:     DataTypes.INTEGER,
  quoted_units:         DataTypes.INTEGER,
  valid_until:          DataTypes.DATEONLY,
  hospital_response_ko: DataTypes.TEXT,
  translation_en:       DataTypes.TEXT,
  translation_zh:       DataTypes.TEXT,
  translation_ja:       DataTypes.TEXT,
  attachments:          DataTypes.JSON,
  sent_to_user_at:      DataTypes.DATE,
  notes:                DataTypes.TEXT,
}, { tableName: 'quotes', timestamps: true, createdAt: 'created_at', updatedAt: false });

export const Trip = sequelize.define('Trip', {
  id:                       { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  user_id:                  { type: DataTypes.UUID, allowNull: false },
  arrival_date:             DataTypes.DATEONLY,
  departure_date:           DataTypes.DATEONLY,
  status:                   { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'planning', validate: { isIn: [TRIP_STATUS_VALUES] } },
  procedures_planned:       DataTypes.JSON,
  accommodation:            DataTypes.JSON,
  interpreter_user_id:      DataTypes.UUID,
  airport_pickup_scheduled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  emergency_contact:        DataTypes.STRING(200),
  notes:                    DataTypes.TEXT,
}, { tableName: 'trips' });

export const Consultation = sequelize.define('Consultation', {
  id:                  { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  user_id:             { type: DataTypes.UUID, allowNull: false },
  trip_id:             DataTypes.UUID,
  scheduled_at:        { type: DataTypes.DATE, allowNull: false },
  duration_min:        DataTypes.SMALLINT,
  language:            { type: DataTypes.STRING(8), allowNull: false },
  phase:               { type: DataTypes.STRING(16), allowNull: false, validate: { isIn: [CONSULT_PHASE_VALUES] } },
  consultant_user_id:  DataTypes.UUID,
  meeting_url:         DataTypes.TEXT,
  notes:               DataTypes.TEXT,
  recommendations:     DataTypes.JSON,
}, { tableName: 'consultations' });

export const PostOpCheckin = sequelize.define('PostOpCheckin', {
  id:                   { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  trip_id:              { type: DataTypes.UUID, allowNull: false },
  procedure_id:         DataTypes.INTEGER,
  day_offset:           { type: DataTypes.SMALLINT, allowNull: false },
  scheduled_at:         DataTypes.DATE,
  completed_at:         DataTypes.DATE,
  user_response:        DataTypes.JSON,
  photo_urls:           DataTypes.JSON,
  flagged_for_review:   { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  resolved_by_user_id:  DataTypes.UUID,
  resolution_notes:     DataTypes.TEXT,
}, { tableName: 'post_op_checkins' });

// -------------------------------------------------------------------
// Doctors (many per hospital, optional brand-wide chain)
// -------------------------------------------------------------------
export const Doctor = sequelize.define('Doctor', {
  id:                { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  slug:              { type: DataTypes.STRING(120), allowNull: false, unique: true },
  hospital_id:       { type: DataTypes.INTEGER, allowNull: false },
  brand_id:          DataTypes.INTEGER,

  name_ko:           { type: DataTypes.STRING(120), allowNull: false },
  name_en:           DataTypes.STRING(120),
  name_zh:           DataTypes.STRING(120),
  name_ja:           DataTypes.STRING(120),

  title_ko:          DataTypes.STRING(120),
  title_en:          DataTypes.STRING(120),
  title_zh:          DataTypes.STRING(120),
  title_ja:          DataTypes.STRING(120),

  portrait_url:      DataTypes.TEXT,
  hero_image_url:    DataTypes.TEXT,
  gallery_urls:      DataTypes.JSON,

  years_experience:  DataTypes.SMALLINT,
  specialties:       DataTypes.JSON,
  education:         DataTypes.JSON,
  certifications:    DataTypes.JSON,
  memberships:       DataTypes.JSON,
  languages_spoken:  DataTypes.JSON,

  bio_ko:            DataTypes.TEXT,
  bio_en:            DataTypes.TEXT,
  bio_zh:            DataTypes.TEXT,
  bio_ja:            DataTypes.TEXT,

  display_order:     { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 0 },
  is_featured:       { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  is_active:         { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  deleted_at:        DataTypes.DATE,
}, { tableName: 'doctors' });

// -------------------------------------------------------------------
// Before/After photos
// -------------------------------------------------------------------
export const BAPhoto = sequelize.define('BAPhoto', {
  id:                { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  hospital_id:       { type: DataTypes.INTEGER, allowNull: false },
  procedure_id:      DataTypes.INTEGER,
  doctor_id:         DataTypes.INTEGER,

  before_url:        { type: DataTypes.TEXT, allowNull: false },
  after_url:         { type: DataTypes.TEXT, allowNull: false },
  followup_urls:     DataTypes.JSON,

  case_title_ko:     DataTypes.STRING(200),
  case_title_en:     DataTypes.STRING(200),
  case_title_zh:     DataTypes.STRING(200),
  case_title_ja:     DataTypes.STRING(200),
  patient_age_range: DataTypes.STRING(16),
  patient_gender:    DataTypes.STRING(8),
  patient_country:   DataTypes.STRING(8),
  weeks_after:       DataTypes.SMALLINT,
  device_brands:     DataTypes.JSON,
  notes_ko:          DataTypes.TEXT,
  notes_en:          DataTypes.TEXT,

  consent_signed:    { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  consent_date:      DataTypes.DATEONLY,
  is_anonymized:     { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  visibility:        { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'logged_in', validate: { isIn: [['public','logged_in','staff_only']] } },
  display_order:     { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 0 },
  is_active:         { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  deleted_at:        DataTypes.DATE,
}, { tableName: 'ba_photos' });

export const PublicFeedEntry = sequelize.define('PublicFeedEntry', {
  id:                  { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  source_type:         { type: DataTypes.STRING(16), allowNull: false, validate: { isIn: [FEED_SOURCE_VALUES] } },
  source_id:           DataTypes.UUID,

  display_initial:     { type: DataTypes.STRING(4), allowNull: false },
  country_code:        DataTypes.STRING(8),
  country_label_en:    DataTypes.STRING(80),
  country_label_zh:    DataTypes.STRING(80),
  country_label_ja:    DataTypes.STRING(80),
  country_label_ko:    DataTypes.STRING(80),

  procedure_id:        DataTypes.INTEGER,
  concern_id:          DataTypes.INTEGER,

  treatment_label_en:  DataTypes.STRING(160),
  treatment_label_zh:  DataTypes.STRING(160),
  treatment_label_ja:  DataTypes.STRING(160),
  treatment_label_ko:  DataTypes.STRING(160),

  outcome:             { type: DataTypes.STRING(16), validate: { isIn: [FEED_OUTCOME_VALUES.concat([null])] } },
  outcome_note_en:     DataTypes.STRING(255),
  outcome_note_zh:     DataTypes.STRING(255),
  outcome_note_ja:     DataTypes.STRING(255),
  outcome_note_ko:     DataTypes.STRING(255),

  is_visible:          { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  is_seed:             { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  priority:            { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 0 },

  displayed_at:        { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  expires_at:          DataTypes.DATE,
}, { tableName: 'public_feed_entries' });

// -------------------------------------------------------------------
// Associations
// -------------------------------------------------------------------
ProcedureCategory.hasMany(Procedure, { foreignKey: 'category_id', as: 'procedures' });
Procedure.belongsTo(ProcedureCategory, { foreignKey: 'category_id', as: 'category' });

ProcedureCategory.hasMany(ProcedureCategory, { foreignKey: 'parent_id', as: 'children' });
ProcedureCategory.belongsTo(ProcedureCategory, { foreignKey: 'parent_id', as: 'parent' });

Brand.hasMany(Hospital, { foreignKey: 'brand_id', as: 'hospitals' });
Hospital.belongsTo(Brand, { foreignKey: 'brand_id', as: 'brand' });

Hospital.hasMany(HospitalProcedure, { foreignKey: 'hospital_id', as: 'offerings' });
HospitalProcedure.belongsTo(Hospital, { foreignKey: 'hospital_id', as: 'hospital' });

Procedure.hasMany(HospitalProcedure, { foreignKey: 'procedure_id', as: 'hospitalOfferings' });
HospitalProcedure.belongsTo(Procedure, { foreignKey: 'procedure_id', as: 'procedure' });

// concern_procedures join (composite PK)
Concern.belongsToMany(Procedure, {
  through: ConcernProcedure,
  foreignKey: 'concern_id',
  otherKey: 'procedure_id',
  as: 'procedures',
});
Procedure.belongsToMany(Concern, {
  through: ConcernProcedure,
  foreignKey: 'procedure_id',
  otherKey: 'concern_id',
  as: 'concerns',
});
// Explicit belongsTo so admin list/edit can eager-load the related rows
// (belongsToMany alone doesn't give us a "concern" alias on the join row).
ConcernProcedure.belongsTo(Concern,   { foreignKey: 'concern_id',   as: 'concern' });
ConcernProcedure.belongsTo(Procedure, { foreignKey: 'procedure_id', as: 'procedure' });

User.hasMany(MatchRequest, { foreignKey: 'user_id', as: 'matchRequests' });
MatchRequest.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

MatchRequest.hasMany(Inquiry, { foreignKey: 'match_request_id', as: 'inquiries' });
Inquiry.belongsTo(MatchRequest, { foreignKey: 'match_request_id', as: 'matchRequest' });
Inquiry.belongsTo(User,      { foreignKey: 'user_id',          as: 'user' });
Inquiry.belongsTo(Hospital,  { foreignKey: 'hospital_id',      as: 'hospital' });
Inquiry.belongsTo(Procedure, { foreignKey: 'procedure_id',     as: 'procedure' });

Inquiry.hasMany(Quote, { foreignKey: 'inquiry_id', as: 'quotes' });
Quote.belongsTo(Inquiry, { foreignKey: 'inquiry_id', as: 'inquiry' });

User.hasMany(Trip, { foreignKey: 'user_id', as: 'trips' });
Trip.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Trip.belongsTo(User, { foreignKey: 'interpreter_user_id', as: 'interpreter' });

Trip.hasMany(PostOpCheckin, { foreignKey: 'trip_id', as: 'checkins' });
PostOpCheckin.belongsTo(Trip,      { foreignKey: 'trip_id',             as: 'trip' });
PostOpCheckin.belongsTo(Procedure, { foreignKey: 'procedure_id',        as: 'procedure' });
PostOpCheckin.belongsTo(User,      { foreignKey: 'resolved_by_user_id', as: 'resolver' });

Trip.hasMany(Consultation, { foreignKey: 'trip_id', as: 'consultations' });
Consultation.belongsTo(Trip, { foreignKey: 'trip_id', as: 'trip' });
Consultation.belongsTo(User, { foreignKey: 'user_id',           as: 'user' });
Consultation.belongsTo(User, { foreignKey: 'consultant_user_id', as: 'consultant' });

PublicFeedEntry.belongsTo(Procedure, { foreignKey: 'procedure_id', as: 'procedure' });
PublicFeedEntry.belongsTo(Concern,   { foreignKey: 'concern_id',   as: 'concern' });

Hospital.hasMany(Doctor, { foreignKey: 'hospital_id', as: 'doctors' });
Doctor.belongsTo(Hospital, { foreignKey: 'hospital_id', as: 'hospital' });
Doctor.belongsTo(Brand,    { foreignKey: 'brand_id',    as: 'brand' });
Brand.hasMany(Doctor,      { foreignKey: 'brand_id',    as: 'doctors' });

Hospital.hasMany(BAPhoto, { foreignKey: 'hospital_id', as: 'baPhotos' });
BAPhoto.belongsTo(Hospital,  { foreignKey: 'hospital_id',  as: 'hospital' });
BAPhoto.belongsTo(Procedure, { foreignKey: 'procedure_id', as: 'procedure' });
BAPhoto.belongsTo(Doctor,    { foreignKey: 'doctor_id',    as: 'doctor' });
Procedure.hasMany(BAPhoto,   { foreignKey: 'procedure_id', as: 'baPhotos' });
Doctor.hasMany(BAPhoto,      { foreignKey: 'doctor_id',    as: 'baPhotos' });

export { Op };
export { sequelize };
