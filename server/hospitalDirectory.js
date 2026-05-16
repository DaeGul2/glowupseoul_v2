// Minimal hospital directory for server-side Google Places lookup.
// MUST stay in sync with v2/client/src/data/hospitals.js + brands.js (slug shape: `${brand}_${branch}`).
// `googlePlaceId` is optional — if set, the API skips the text search and goes straight to placeDetails.

export const hospitalDirectory = {
  'soi_강남점':              { name_ko: '소이의원',                 name_en: 'Soi Clinic',                  city: 'Seoul',  district: 'Gangnam',  neighborhood: 'Yeoksam',     query_en: 'Soi Clinic Gangnam Yeoksam Seoul',                website: 'https://www.soiclinic24.co.kr/' },
  'vellicell_강남점':        { name_ko: '벨리셀의원',                name_en: 'Vellicell Clinic',            city: 'Seoul',  district: 'Gangnam',  neighborhood: 'Nonhyeon',    query_en: 'Vellicell Clinic Gangnam Seoul',                  website: 'https://gangnam.vellicellclinic.com/' },
  'ayun_청담점':             { name_ko: '아윤의원',                  name_en: 'Ayun Clinic',                 city: 'Seoul',  district: 'Gangnam',  neighborhood: 'Cheongdam',   query_en: 'Ayun Clinic Cheongdam Seoul',                     website: 'https://ayunclinic.com/' },
  'dewyd_강남점':            { name_ko: '듀이디의원',                name_en: 'Dewyd Clinic',                city: 'Seoul',  district: 'Gangnam',  neighborhood: 'Sinsa',       query_en: 'Dewyd Clinic Sinsa Gangnam Seoul',                website: 'https://www.dewydclinic.com/' },
  'lamiche_청담점':          { name_ko: '클럽미즈라미체의원',         name_en: 'Club Miz Lamiche Clinic',     city: 'Seoul',  district: 'Gangnam',  neighborhood: 'Cheongdam',   query_en: 'Lamiche Clinic Cheongdam Seoul',                  website: 'https://www.lamiche.co.kr/' },
  'wooamedical_강남점':      { name_ko: '우아 성형외과',             name_en: 'Wooa Plastic Surgery',        city: 'Seoul',  district: 'Gangnam',  neighborhood: 'Sinsa',       query_en: 'Wooa Plastic Surgery Sinsa Seoul',                website: 'https://wooamedical.com/' },
  'wannabe_강남점':          { name_ko: '워너비 성형외과',           name_en: 'Wannabe Plastic Surgery',     city: 'Seoul',  district: 'Gangnam',  neighborhood: 'Sinsa',       query_en: 'Wannabe Plastic Surgery Sinsa Seoul',             website: 'https://www.wannabeps.com/' },
  'vannyps_강남점':          { name_ko: '반니 성형외과',             name_en: 'Vanny Plastic Surgery',       city: 'Seoul',  district: 'Gangnam',  neighborhood: 'Nonhyeon',    query_en: 'Vanny Plastic Surgery Nonhyeon Seoul',            website: 'https://vannyps.com/' },
  'hershe_청담점':           { name_ko: 'Hershe 성형외과',           name_en: 'Hershe Plastic Surgery',      city: 'Seoul',  district: 'Gangnam',  neighborhood: 'Cheongdam',   query_en: 'Hershe Plastic Surgery Cheongdam Seoul',          website: 'http://m.hershebeauty.com/' },
  '365mc_강남본원':          { name_ko: '365mc 병원',                name_en: '365mc Hospital',              city: 'Seoul',  district: 'Gangnam',  neighborhood: 'Nonhyeon',    query_en: '365mc Hospital Gangnam Seoul',                    website: 'https://seoul.365mc.com/' },
  'lienjang_강남점':         { name_ko: '리엔장 피부과·성형외과',     name_en: 'Lienjang Clinic',             city: 'Seoul',  district: 'Gangnam',  neighborhood: 'Yeoksam',     query_en: 'Lienjang Clinic Gangnam Seoul',                   website: 'https://gangnam.lienjang.net/' },
  'noselips_강남점':         { name_ko: '최우식 노즈립 성형외과',     name_en: 'Noselips Plastic Surgery',    city: 'Seoul',  district: 'Gangnam',  neighborhood: 'Sinsa',       query_en: 'Noselips Plastic Surgery Sinsa Seoul',            website: 'https://www.noselips.co.kr/' },
  'drtunes_강남점':          { name_ko: '살롱드닥터튠즈 의원',        name_en: 'Salon de Dr Tunes',           city: 'Seoul',  district: 'Gangnam',  neighborhood: 'Nonhyeon',    query_en: 'Salon de Dr Tunes Clinic Gangnam Seoul',          website: 'https://salondedrtunes.kr/' },
  'cellora_강남점':          { name_ko: '셀로라 의원',               name_en: 'Cellora Clinic',              city: 'Seoul',  district: 'Gangnam',  neighborhood: 'Sinsa',       query_en: 'Cellora Clinic Gangnam Seoul',                    website: 'https://cellora.gu.clinic/' },
  '1mm_강남점':              { name_ko: '1mm 성형외과',              name_en: '1mm Plastic Surgery',         city: 'Seoul',  district: 'Gangnam',  neighborhood: 'Sinsa',       query_en: '1mm Plastic Surgery Gangnam Seoul',               website: 'https://en.1mmps.com/' },
  'eunel_강남점':            { name_ko: '유넬의원',                  name_en: 'Eunel Clinic',                city: 'Seoul',  district: 'Gangnam',  neighborhood: 'Cheongdam',   query_en: 'Eunel Clinic Gangnam Seoul',                      website: 'https://eunelclinic.co.kr/' },
  'lead_강남점':             { name_ko: '리드 성형외과',             name_en: 'Lead Plastic Surgery',        city: 'Seoul',  district: 'Gangnam',  neighborhood: 'Nonhyeon',    query_en: 'Lead Plastic Surgery Gangnam Seoul',              website: 'https://lead.ps/' },
  'sunnygarden_강남점':      { name_ko: '햇살담은 뜰 정원 의원',     name_en: 'Sunny Garden Clinic',         city: 'Seoul',  district: 'Gangnam',  neighborhood: 'Nonhyeon',    query_en: 'Sunny Garden Clinic Gangnam Seoul',               website: 'https://sunnygardenclinic.imweb.me/' },
  'drkoops_강남점':          { name_ko: '그림 성형외과',             name_en: 'Drkoops Geurim Plastic',      city: 'Seoul',  district: 'Gangnam',  neighborhood: 'Sinsa',       query_en: 'Geurim Plastic Surgery Drkoops Sinsa Seoul',      website: 'https://m.drkoops.co.kr/' },
  'thepride_강남점':         { name_ko: '더프라이드 성형외과',       name_en: 'The Pride Plastic Surgery',   city: 'Seoul',  district: 'Gangnam',  neighborhood: 'Sinsa',       query_en: 'The Pride Plastic Surgery Gangnam Seoul',         website: 'https://www.thepride.co.kr' },
  'lienjang_dental_강남점':  { name_ko: '리엔장 치과',               name_en: 'Lienjang Dental',             city: 'Seoul',  district: 'Gangnam',  neighborhood: 'Yeoksam',     query_en: 'Lienjang Dental Clinic Gangnam Seoul',            website: 'https://gangnam.dental.lienjang.net/' },
  'centumcore_센텀점':       { name_ko: '센텀코어 피부과·성형외과',  name_en: 'Centum Core Clinic',          city: 'Busan',  district: 'Haeundae', neighborhood: 'Marine City', query_en: 'Centum Core Clinic Haeundae Busan',               website: 'https://centumcore.com/' },
};

export function getHospitalForReviewQuery(slug) {
  return hospitalDirectory[slug] || null;
}
