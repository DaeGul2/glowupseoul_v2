// v3 Sequelize models — treatments(비수술) + surgeries(수술).
// Two physically-separate tables with the same column shape (see db/schema.v3.sql).
// Defined against the same getSequelize() singleton (DB_NAME=glowupseoul_v3).

import { DataTypes, Op } from 'sequelize';
import { getSequelize } from './sequelize.js';

const sequelize = getSequelize();

// Shared column definition for both 시술 / 수술 tables.
function catalogColumns() {
  return {
    id:             { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    slug:           { type: DataTypes.STRING(80), allowNull: false, unique: true },

    name:           { type: DataTypes.STRING(160), allowNull: false },   // 영문 전용
    summary:        { type: DataTypes.STRING(400) },                     // 영문 전용
    description:    { type: DataTypes.TEXT },                             // Markdown 원문

    price_krw:      { type: DataTypes.INTEGER },
    price_note:     { type: DataTypes.STRING(255) },

    // 효과 지속 — 규격화 enum (매칭용). 자유텍스트 아님.
    duration:       { type: DataTypes.ENUM('temporary', 'months_3_6', 'months_6_12', 'year_1_2', 'years_2_plus', 'semi_permanent', 'permanent') },

    pain_level:     { type: DataTypes.ENUM('soft', 'mild', 'hard') },
    recovery_level: { type: DataTypes.ENUM('immediate', '1_2_days', '1_week_plus') },
    recovery_note:  { type: DataTypes.STRING(400) },

    benefits:       { type: DataTypes.JSON },   // string[] — 장점/추천 대상
    cautions:       { type: DataTypes.JSON },   // string[] — 유의할 점
    linked_note:    { type: DataTypes.TEXT },

    thumbnail_url:  { type: DataTypes.TEXT },

    display_order:  { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 0 },
    is_active:      { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    deleted_at:     { type: DataTypes.DATE },
  };
}

const opts = (tableName) => ({
  sequelize,
  tableName,
  freezeTableName: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export const Treatment = sequelize.define('Treatment', catalogColumns(), opts('treatments'));
export const Surgery   = sequelize.define('Surgery',   catalogColumns(), opts('surgeries'));

// -------------------------------------------------------------------
// tags — shared tag master + M:N join tables (real FKs, see schema.v3.sql).
// "다중선택 필드는 콤마 문자열 금지, 전부 FK 정규화" 원칙.
// -------------------------------------------------------------------
export const Tag = sequelize.define('Tag', {
  id:            { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  slug:          { type: DataTypes.STRING(80), allowNull: false, unique: true },
  name:          { type: DataTypes.STRING(80), allowNull: false },   // 영문 전용
  display_order: { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 0 },
  is_active:     { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, opts('tags'));

// Explicit join models (composite PK, no timestamps) so Sequelize doesn't
// expect created_at/updated_at columns on the join tables.
const joinOpts = (tableName) => ({ sequelize, tableName, freezeTableName: true, timestamps: false });

export const TreatmentTag = sequelize.define('TreatmentTag', {
  treatment_id: { type: DataTypes.INTEGER, primaryKey: true },
  tag_id:       { type: DataTypes.INTEGER, primaryKey: true },
}, joinOpts('treatment_tags'));

export const SurgeryTag = sequelize.define('SurgeryTag', {
  surgery_id: { type: DataTypes.INTEGER, primaryKey: true },
  tag_id:     { type: DataTypes.INTEGER, primaryKey: true },
}, joinOpts('surgery_tags'));

Treatment.belongsToMany(Tag, { through: TreatmentTag, foreignKey: 'treatment_id', otherKey: 'tag_id', as: 'tags' });
Tag.belongsToMany(Treatment, { through: TreatmentTag, foreignKey: 'tag_id', otherKey: 'treatment_id', as: 'treatments' });

Surgery.belongsToMany(Tag, { through: SurgeryTag, foreignKey: 'surgery_id', otherKey: 'tag_id', as: 'tags' });
Tag.belongsToMany(Surgery, { through: SurgeryTag, foreignKey: 'tag_id', otherKey: 'surgery_id', as: 'surgeries' });

// -------------------------------------------------------------------
// concerns — 부위(concern_areas) → 세부 고민(concerns) → 시술/수술 매핑.
// 질문지(부위·고민)와 매칭(고민→시술)이 전부 이 테이블에서 나온다.
// -------------------------------------------------------------------
export const ConcernArea = sequelize.define('ConcernArea', {
  id:            { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  slug:          { type: DataTypes.STRING(80), allowNull: false, unique: true },
  name:          { type: DataTypes.STRING(120), allowNull: false },
  track:         { type: DataTypes.ENUM('surgical', 'non_surgical', 'both'), allowNull: false, defaultValue: 'both' },
  display_order: { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 0 },
  is_active:     { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, opts('concern_areas'));

export const Concern = sequelize.define('Concern', {
  id:            { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  slug:          { type: DataTypes.STRING(80), allowNull: false, unique: true },
  name:          { type: DataTypes.STRING(120), allowNull: false },
  area_id:       { type: DataTypes.INTEGER },
  display_order: { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 0 },
  is_active:     { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, opts('concerns'));

ConcernArea.hasMany(Concern, { foreignKey: 'area_id', as: 'concerns' });
Concern.belongsTo(ConcernArea, { foreignKey: 'area_id', as: 'area' });

export const TreatmentConcern = sequelize.define('TreatmentConcern', {
  treatment_id: { type: DataTypes.INTEGER, primaryKey: true },
  concern_id:   { type: DataTypes.INTEGER, primaryKey: true },
  relevance:    { type: DataTypes.ENUM('primary', 'secondary'), allowNull: false, defaultValue: 'primary' },
  reason:       { type: DataTypes.TEXT },
}, joinOpts('treatment_concerns'));

export const SurgeryConcern = sequelize.define('SurgeryConcern', {
  surgery_id: { type: DataTypes.INTEGER, primaryKey: true },
  concern_id: { type: DataTypes.INTEGER, primaryKey: true },
  relevance:  { type: DataTypes.ENUM('primary', 'secondary'), allowNull: false, defaultValue: 'primary' },
  reason:     { type: DataTypes.TEXT },
}, joinOpts('surgery_concerns'));

Treatment.belongsToMany(Concern, { through: TreatmentConcern, foreignKey: 'treatment_id', otherKey: 'concern_id', as: 'concerns' });
Concern.belongsToMany(Treatment, { through: TreatmentConcern, foreignKey: 'concern_id', otherKey: 'treatment_id', as: 'treatments' });
Surgery.belongsToMany(Concern, { through: SurgeryConcern, foreignKey: 'surgery_id', otherKey: 'concern_id', as: 'concerns' });
Concern.belongsToMany(Surgery, { through: SurgeryConcern, foreignKey: 'concern_id', otherKey: 'surgery_id', as: 'surgeries' });

// -------------------------------------------------------------------
// settings — 운영 설정 key-value. admin 설정 탭에서 관리, .env 폴백.
// -------------------------------------------------------------------
export const Setting = sequelize.define('Setting', {
  skey:  { type: DataTypes.STRING(64), primaryKey: true },
  value: { type: DataTypes.TEXT },
}, opts('settings'));

// -------------------------------------------------------------------
// bookings — 컨시어지 트립 부킹. requested 는 날짜를 안 막고,
// confirmed 의 confirmed_start~end 기간만 전체 캘린더를 차단한다.
// item_kind='block' = 운영자 개인 일정 차단 행.
// -------------------------------------------------------------------
export const Booking = sequelize.define('Booking', {
  id:              { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  code:            { type: DataTypes.STRING(16), allowNull: false, unique: true },

  item_kind:       { type: DataTypes.ENUM('treatment', 'surgery', 'block'), allowNull: false },
  item_id:         { type: DataTypes.INTEGER },
  item_name:       { type: DataTypes.STRING(200) },        // 스냅샷 — 시술명 변경/삭제돼도 기록 유지

  client_name:     { type: DataTypes.STRING(120) },
  country_code:    { type: DataTypes.STRING(8) },
  whatsapp:        { type: DataTypes.STRING(40) },
  email:           { type: DataTypes.STRING(200) },
  notes:           { type: DataTypes.TEXT },

  requested_date:  { type: DataTypes.DATEONLY },
  status:          { type: DataTypes.ENUM('requested', 'confirmed', 'completed', 'cancelled', 'declined'), allowNull: false, defaultValue: 'requested' },
  confirmed_start: { type: DataTypes.DATEONLY },
  confirmed_end:   { type: DataTypes.DATEONLY },
  admin_note:      { type: DataTypes.TEXT },
}, opts('bookings'));

// -------------------------------------------------------------------
// partner_submissions — 파트너 신청서 inbox. 구 server/submissions/*.json
// 파일 저장 대체 (ephemeral 디스크 환경에서 재배포 시 유실 방지).
// -------------------------------------------------------------------
export const PartnerSubmission = sequelize.define('PartnerSubmission', {
  id:      { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  code:    { type: DataTypes.STRING(24), allowNull: false, unique: true },   // 'PA-...'
  fkey:    { type: DataTypes.STRING(160), allowNull: false, unique: true },  // 구 파일명 호환 키
  status:  { type: DataTypes.ENUM('submitted', 'approved', 'rejected'), allowNull: false, defaultValue: 'submitted' },
  payload: { type: DataTypes.JSON, allowNull: false },
}, opts('partner_submissions'));

export { sequelize, Op };
