/*!
 * Данные для калькулятора, планировщика сроков и галерей кейсов ЦРВУ.
 * Источник: crvu/strategy/data.json (разделы calculator, planner, expo_calendar), срез на 09.10.2026.
 *
 * ВАЖНО: диапазоны ₽/м² и коэффициенты (по типу стенда, по площади, надбавки) — рыночный ориентир
 * и допущения из стратегии. Их нужно подтвердить у ЦРВУ до публикации (см. README, раздел «Что подтвердить»).
 * Чтобы изменить расчёт, достаточно поправить числа ниже: формулы лежат в calculator.js.
 */
(function (w) {
  'use strict';

  w.CRVU_DATA = {
    asOf: '2026-10-09',

    /* ---------- Калькулятор-ориентир ---------- */
    calculator: {
      areaMin: 10,
      areaMax: 300,
      round: 10000,
      levels: {
        standard:  { label: 'Стандарт',  min: 35000, max: 45000, openEnded: false, text: 'Индивидуальный дизайн на типовых и комбинированных конструкциях.' },
        exclusive: { label: 'Эксклюзив', min: 45000, max: 60000, openEnded: false, text: 'Авторская архитектура и индивидуальное производство.' },
        premium:   { label: 'Премиум',   min: 60000, max: 90000, openEnded: true,  text: 'Сложная геометрия, авторский декор, мультимедиа.' }
      },
      /* коэффициент по площади: S <= upTo */
      areaK: [
        { upTo: 30, k: 1.10 },
        { upTo: 60, k: 1.00 },
        { upTo: 100, k: 0.92 },
        { upTo: Infinity, k: 0.88 }
      ],
      types: {
        linear:    { label: 'Линейный',   sides: 1, k: 1.00 },
        corner:    { label: 'Угловой',    sides: 2, k: 1.05 },
        peninsula: { label: 'Полуостров', sides: 3, k: 1.10 },
        island:    { label: 'Остров',     sides: 4, k: 1.15 }
      },
      floor2:    { min: 1.75, max: 2.0 },   /* множитель к базе */
      suspended: { min: 0.20, max: 0.50 },  /* подвесные элементы и подиум: +20–50 % */
      urgency:   { min: 0.15, max: 0.30 },  /* меньше 3 недель до монтажа: +15–30 % */
      ledPrice: 80000,                      /* ₽ за позицию, «от», верхней границы нет */
      ledMax: 6
    },

    /* ---------- Площадки ---------- */
    venues: {
      crocus: { label: 'Крокус Экспо',    docBdays: 14 },
      texpo:  { label: 'Тимирязев Центр', docBdays: 15 },
      other:  { label: 'Другая площадка', docBdays: null }
    },
    /* список площадок для калькулятора и квиза */
    venueOptions: [
      { value: 'crocus',   label: 'Крокус Экспо',    key: 'crocus' },
      { value: 'expocentr', label: 'Экспоцентр',     key: 'other' },
      { value: 'vdnh',     label: 'ВДНХ',            key: 'other' },
      { value: 'expoforum', label: 'Экспофорум',     key: 'other' },
      { value: 'texpo',    label: 'Тимирязев Центр', key: 'texpo' },
      { value: 'other',    label: 'Другая площадка', key: 'other' }
    ],

    /* ---------- Модель планировщика ---------- */
    model: {
      comfortableMonths: 3,   /* комфортный старт: за 3 месяца до открытия */
      standardWeeks: 6,       /* стандартный старт: за 6 недель до первого дня монтажа */
      latestMinusBdays: 5,    /* последний старт без наценки: срок подачи документов минус 5 рабочих дней */
      expressDays: 12,        /* предел экспресса: открытие минус 1 день минус 12 дней */
      setupOffsetDays: 5      /* если организатор не публикует монтаж: за 5 дней до открытия */
    },

    /* ---------- Календарь выставок (16 позиций, ноябрь 2026 — октябрь 2027) ---------- */
    expos: [
      {
        "id": "pharmtech-2026",
        "name": "Pharmtech & Ingredients 2026",
        "dates": "24–27.11.2026",
        "venue": "Крокус Экспо",
        "venueKey": "crocus",
        "industry": "Фармацевтика и ингредиенты",
        "confirmed": true,
        "open": "2026-11-24",
        "close": "2026-11-27",
        "setup": null,
        "planner": {
          "first_setup_day": "2026-11-19",
          "first_setup_day_basis": "допущение: за 5 дней до открытия",
          "comfortable_start": "2026-08-24",
          "standard_start": "2026-10-08",
          "docs_deadline": "2026-10-30",
          "latest_start_without_venue_surcharge": "2026-10-23",
          "express_limit_start": "2026-11-11"
        }
      },
      {
        "id": "zdravoohranenie-2026",
        "name": "Здравоохранение-2026",
        "dates": "7–10.12.2026",
        "venue": "Крокус Экспо",
        "venueKey": "crocus",
        "industry": "Медицина и здравоохранение",
        "confirmed": true,
        "open": "2026-12-07",
        "close": "2026-12-10",
        "setup": "02–06.12.2026",
        "planner": {
          "first_setup_day": "2026-12-02",
          "first_setup_day_basis": "опубликован организатором",
          "comfortable_start": "2026-09-07",
          "standard_start": "2026-10-21",
          "docs_deadline": "2026-11-12",
          "latest_start_without_venue_surcharge": "2026-11-05",
          "express_limit_start": "2026-11-24"
        }
      },
      {
        "id": "upakexpo-2027",
        "name": "UPAKEXPO 2027",
        "dates": "26–29.01.2027",
        "venue": "ВДНХ Экспо",
        "venueKey": "other",
        "industry": "Упаковка, пластик, переработка",
        "confirmed": true,
        "open": "2027-01-26",
        "close": "2027-01-29",
        "setup": null,
        "planner": {
          "first_setup_day": "2027-01-21",
          "first_setup_day_basis": "допущение: за 5 дней до открытия",
          "comfortable_start": "2026-10-26",
          "standard_start": "2026-12-10",
          "docs_deadline": null,
          "latest_start_without_venue_surcharge": null,
          "express_limit_start": "2027-01-13"
        }
      },
      {
        "id": "aquaflame-2027",
        "name": "Aquaflame 2027",
        "dates": "1–4.02.2027",
        "venue": "Крокус Экспо",
        "venueKey": "crocus",
        "industry": "Отопление, водоснабжение, бассейны, инженерные решения",
        "confirmed": true,
        "open": "2027-02-01",
        "close": "2027-02-04",
        "setup": null,
        "planner": {
          "first_setup_day": "2027-01-27",
          "first_setup_day_basis": "допущение: за 5 дней до открытия",
          "comfortable_start": "2026-11-01",
          "standard_start": "2026-12-16",
          "docs_deadline": "2027-01-07",
          "latest_start_without_venue_surcharge": "2026-12-31",
          "express_limit_start": "2027-01-19"
        }
      },
      {
        "id": "prodexpo-2027",
        "name": "Продэкспо-2027",
        "dates": "01–04.03.2027",
        "venue": "Крокус Экспо",
        "venueKey": "crocus",
        "industry": "Продукты питания, напитки, оборудование",
        "confirmed": true,
        "open": "2027-03-01",
        "close": "2027-03-04",
        "setup": null,
        "planner": {
          "first_setup_day": "2027-02-24",
          "first_setup_day_basis": "допущение: за 5 дней до открытия",
          "comfortable_start": "2026-12-01",
          "standard_start": "2027-01-13",
          "docs_deadline": "2027-02-04",
          "latest_start_without_venue_surcharge": "2027-01-28",
          "express_limit_start": "2027-02-16"
        }
      },
      {
        "id": "transrussia-2027",
        "name": "TransRussia / SkladTech 2027",
        "dates": "16–18.03.2027",
        "venue": "Крокус Экспо",
        "venueKey": "crocus",
        "industry": "Транспорт, логистика, складские технологии",
        "confirmed": true,
        "open": "2027-03-16",
        "close": "2027-03-18",
        "setup": null,
        "planner": {
          "first_setup_day": "2027-03-11",
          "first_setup_day_basis": "допущение: за 5 дней до открытия",
          "comfortable_start": "2026-12-16",
          "standard_start": "2027-01-28",
          "docs_deadline": "2027-02-19",
          "latest_start_without_venue_surcharge": "2027-02-12",
          "express_limit_start": "2027-03-03"
        }
      },
      {
        "id": "modern-bakery-2027",
        "name": "Modern Bakery | Confex 2027",
        "dates": "23–26.03.2027",
        "venue": "Тимирязев Центр",
        "venueKey": "texpo",
        "industry": "Хлебопечение, кондитерская отрасль",
        "confirmed": true,
        "open": "2027-03-23",
        "close": "2027-03-26",
        "setup": null,
        "planner": {
          "first_setup_day": "2027-03-18",
          "first_setup_day_basis": "допущение: за 5 дней до открытия",
          "comfortable_start": "2026-12-23",
          "standard_start": "2027-02-04",
          "docs_deadline": "2027-02-25",
          "latest_start_without_venue_surcharge": "2027-02-18",
          "express_limit_start": "2027-03-10"
        }
      },
      {
        "id": "mosbuild-2027",
        "name": "MosBuild 2027",
        "dates": "30.03–02.04.2027",
        "venue": "Крокус Экспо",
        "venueKey": "crocus",
        "industry": "Строительство и интерьер",
        "confirmed": true,
        "open": "2027-03-30",
        "close": "2027-04-02",
        "setup": null,
        "planner": {
          "first_setup_day": "2027-03-25",
          "first_setup_day_basis": "допущение: за 5 дней до открытия",
          "comfortable_start": "2026-12-30",
          "standard_start": "2027-02-11",
          "docs_deadline": "2027-03-05",
          "latest_start_without_venue_surcharge": "2027-02-26",
          "express_limit_start": "2027-03-17"
        }
      },
      {
        "id": "expoelectronica-2027",
        "name": "ExpoElectronica 2027",
        "dates": "13–15.04.2027",
        "venue": "Крокус Экспо",
        "venueKey": "crocus",
        "industry": "Электроника и электронные компоненты",
        "confirmed": true,
        "open": "2027-04-13",
        "close": "2027-04-15",
        "setup": null,
        "planner": {
          "first_setup_day": "2027-04-08",
          "first_setup_day_basis": "допущение: за 5 дней до открытия",
          "comfortable_start": "2027-01-13",
          "standard_start": "2027-02-25",
          "docs_deadline": "2027-03-19",
          "latest_start_without_venue_surcharge": "2027-03-12",
          "express_limit_start": "2027-03-31"
        }
      },
      {
        "id": "metalworking-2027",
        "name": "Металлообработка-2027",
        "dates": "11–14.05.2027",
        "venue": "Крокус Экспо",
        "venueKey": "crocus",
        "industry": "Металлообработка, станки",
        "confirmed": true,
        "open": "2027-05-11",
        "close": "2027-05-14",
        "setup": "05–10.05.2027",
        "planner": {
          "first_setup_day": "2027-05-05",
          "first_setup_day_basis": "опубликован организатором",
          "comfortable_start": "2027-02-11",
          "standard_start": "2027-03-24",
          "docs_deadline": "2027-04-15",
          "latest_start_without_venue_surcharge": "2027-04-08",
          "express_limit_start": "2027-04-28"
        }
      },
      {
        "id": "ctt-expo-2027",
        "name": "CTT Expo 2027",
        "dates": "25–28.05.2027",
        "venue": "Крокус Экспо",
        "venueKey": "crocus",
        "industry": "Строительная и дорожная техника",
        "confirmed": true,
        "open": "2027-05-25",
        "close": "2027-05-28",
        "setup": "22–24.05.2027",
        "planner": {
          "first_setup_day": "2027-05-22",
          "first_setup_day_basis": "опубликован организатором",
          "comfortable_start": "2027-02-25",
          "standard_start": "2027-04-10",
          "docs_deadline": "2027-05-04",
          "latest_start_without_venue_surcharge": "2027-04-27",
          "express_limit_start": "2027-05-12"
        }
      },
      {
        "id": "rosupack-2027",
        "name": "RosUpack 2027",
        "dates": "15–18.06.2027",
        "venue": "Крокус Экспо",
        "venueKey": "crocus",
        "industry": "Упаковка",
        "confirmed": true,
        "open": "2027-06-15",
        "close": "2027-06-18",
        "setup": null,
        "planner": {
          "first_setup_day": "2027-06-10",
          "first_setup_day_basis": "допущение: за 5 дней до открытия",
          "comfortable_start": "2027-03-15",
          "standard_start": "2027-04-29",
          "docs_deadline": "2027-05-21",
          "latest_start_without_venue_surcharge": "2027-05-14",
          "express_limit_start": "2027-06-02"
        }
      },
      {
        "id": "mims-2027",
        "name": "MIMS Automobility Moscow 2027",
        "dates": "24–27.08.2027",
        "venue": "ВДНХ Экспо",
        "venueKey": "other",
        "industry": "Автомобильная отрасль, автосервис",
        "confirmed": true,
        "open": "2027-08-24",
        "close": "2027-08-27",
        "setup": null,
        "planner": {
          "first_setup_day": "2027-08-19",
          "first_setup_day_basis": "допущение: за 5 дней до открытия",
          "comfortable_start": "2027-05-24",
          "standard_start": "2027-07-08",
          "docs_deadline": null,
          "latest_start_without_venue_surcharge": null,
          "express_limit_start": "2027-08-11"
        }
      },
      {
        "id": "worldfood-2027",
        "name": "WorldFood Moscow 2027",
        "dates": "14–17.09.2027",
        "venue": "Крокус Экспо",
        "venueKey": "crocus",
        "industry": "Продукты питания и напитки",
        "confirmed": true,
        "open": "2027-09-14",
        "close": "2027-09-17",
        "setup": null,
        "planner": {
          "first_setup_day": "2027-09-09",
          "first_setup_day_basis": "допущение: за 5 дней до открытия",
          "comfortable_start": "2027-06-14",
          "standard_start": "2027-07-29",
          "docs_deadline": "2027-08-20",
          "latest_start_without_venue_surcharge": "2027-08-13",
          "express_limit_start": "2027-09-01"
        }
      },
      {
        "id": "agroprodmash-2027",
        "name": "Агропродмаш-2027",
        "dates": "28.09–01.10.2027",
        "venue": "Крокус Экспо",
        "venueKey": "crocus",
        "industry": "Оборудование для пищевой и перерабатывающей промышленности",
        "confirmed": true,
        "open": "2027-09-28",
        "close": "2027-10-01",
        "setup": "23–27.09.2027",
        "planner": {
          "first_setup_day": "2027-09-23",
          "first_setup_day_basis": "опубликован организатором",
          "comfortable_start": "2027-06-28",
          "standard_start": "2027-08-12",
          "docs_deadline": "2027-09-03",
          "latest_start_without_venue_surcharge": "2027-08-27",
          "express_limit_start": "2027-09-15"
        }
      },
      {
        "id": "provoloka-2027",
        "name": "ПРОВОЛОКА 2027",
        "dates": "май 2027 (точные даты не опубликованы)",
        "venue": "Тимирязев Центр",
        "venueKey": "texpo",
        "industry": "Проволока, метизы, кабельная продукция",
        "confirmed": false,
        "open": null,
        "close": null,
        "setup": null,
        "planner": null
      }
    ],

    /* ---------- Галереи кейсов (только реальные фото ЦРВУ) ---------- */
    cases: {
      "avito": {
        "title": "Avito Auto",
        "meta": "MIMS Automobility 2026",
        "images": [
          {
            "f": "avito-auto-mims-2026-front-left-wide-img3667-1920",
            "w": 1920,
            "h": 1280,
            "alt": "Стенд Avito Auto на выставке MIMS Automobility 2026 с подвешенным автомобилем"
          },
          {
            "f": "avito-auto-mims-2026-suspended-car-front-img3833-1200",
            "w": 1200,
            "h": 800,
            "alt": "Стенд Avito Auto на выставке MIMS Automobility 2026: подвешенный автомобиль крупным планом"
          },
          {
            "f": "avito-auto-mims-2026-reception-car-img3738-1200",
            "w": 1200,
            "h": 800,
            "alt": "Стенд Avito Auto на выставке MIMS Automobility 2026: ресепшн и подвешенный автомобиль"
          },
          {
            "f": "avito-auto-mims-2026-car-rings-hundred-wide-img3991-1200",
            "w": 1200,
            "h": 800,
            "alt": "Стенд Avito Auto на выставке MIMS Automobility 2026: подвесное кольцо с автомобилем над стендом"
          },
          {
            "f": "avito-auto-mims-2026-panorama-img3754-1200",
            "w": 1200,
            "h": 915,
            "alt": "Стенд Avito Auto на выставке MIMS Automobility 2026: панорамный вид на ресепшн и подвесную конструкцию"
          },
          {
            "f": "avito-auto-mims-2026-open-interior-img3778-1200",
            "w": 1200,
            "h": 800,
            "alt": "Стенд Avito Auto на выставке MIMS Automobility 2026: вид внутрь стенда"
          },
          {
            "f": "avito-auto-mims-2026-lounge-meeting-img4393-1200",
            "w": 1200,
            "h": 800,
            "alt": "Стенд Avito Auto на выставке MIMS Automobility 2026: лаунж-зона для переговоров"
          },
          {
            "f": "avito-auto-mims-2026-crowded-front-img4332-1200",
            "w": 1200,
            "h": 800,
            "alt": "Стенд Avito Auto на выставке MIMS Automobility 2026: посетители у ресепшн"
          },
          {
            "f": "avito-auto-mims-2026-rear-crowded-img4375-1200",
            "w": 1200,
            "h": 800,
            "alt": "Стенд Avito Auto на выставке MIMS Automobility 2026: вид со стороны прохода"
          },
          {
            "f": "avito-auto-mims-2026-team-table-img4043-1200",
            "w": 1200,
            "h": 1800,
            "alt": "Стенд Avito Auto на выставке MIMS Automobility 2026: команда на стенде"
          }
        ]
      },
      "intek": {
        "title": "Intek",
        "meta": "Металлообработка 2026",
        "images": [
          {
            "f": "intek-metalworking-2026-front-left-wide-0001-1920",
            "w": 1920,
            "h": 1280,
            "alt": "Стенд Intek на выставке Металлообработка 2026"
          }
        ]
      },
      "miratorg": {
        "title": "Мираторг",
        "meta": "FoodExpo Qazaqstan 2025",
        "images": [
          {
            "f": "miratorg-foodexpo-kazakhstan-2025-006-1920",
            "w": 1920,
            "h": 1277,
            "alt": "Стенд Мираторг на выставке FoodExpo Qazaqstan 2025"
          }
        ]
      },
      "alcopack": {
        "title": "ALCOPACK",
        "meta": "Pharmtech 2024",
        "images": [
          {
            "f": "alcopack-pharmtech-2024-front-main-002-1920",
            "w": 1920,
            "h": 1280,
            "alt": "Стенд ALCOPACK на выставке Pharmtech 2024"
          }
        ]
      },
      "decomaster": {
        "title": "Decomaster",
        "meta": "MosBuild 2025",
        "images": [
          {
            "f": "decomaster-mosbuild-2025-corner-002-1920",
            "w": 1920,
            "h": 1280,
            "alt": "Стенд Decomaster на выставке MosBuild 2025"
          }
        ]
      },
      "norgau": {
        "title": "NORGAU",
        "meta": "Металлообработка 2026",
        "images": [
          {
            "f": "norgau-metalworking-2026-front-left-002-1920",
            "w": 1920,
            "h": 1280,
            "alt": "Стенд NORGAU на выставке Металлообработка 2026"
          }
        ]
      },
      "europak": {
        "title": "Europak",
        "meta": "TransRussia 2026",
        "images": [
          {
            "f": "europak-transrussia-2026-002-1920",
            "w": 1920,
            "h": 1280,
            "alt": "Стенд Europak на выставке TransRussia 2026"
          },
          {
            "f": "europak-transrussia-2026-001-1920",
            "w": 1920,
            "h": 1280,
            "alt": "Стенд Europak на выставке TransRussia 2026: общий вид спереди"
          },
          {
            "f": "europak-transrussia-2026-004-1920",
            "w": 1920,
            "h": 1280,
            "alt": "Стенд Europak на выставке TransRussia 2026: вид со стороны ресепшн"
          },
          {
            "f": "europak-transrussia-2026-009-1920",
            "w": 1920,
            "h": 1280,
            "alt": "Стенд Europak на выставке TransRussia 2026: переговорная зона"
          },
          {
            "f": "europak-transrussia-2026-011-1920",
            "w": 1920,
            "h": 1280,
            "alt": "Стенд Europak на выставке TransRussia 2026: лаунж-зона с экраном"
          },
          {
            "f": "europak-transrussia-2026-025-1920",
            "w": 1920,
            "h": 1280,
            "alt": "Стенд Europak на выставке TransRussia 2026: стенд в потоке посетителей"
          }
        ]
      }
    }
  };
  var D=w.CRVU_DATA;
  D.calendar={years:[2026,2027],source2026:'https://www.consultant.ru/law/ref/calendar/proizvodstvennye/2026/',source2027:'http://duma.gov.ru/news/64101/',off:['2026-01-09','2026-03-09','2026-05-11','2026-12-31','2027-02-22','2027-05-03','2027-05-10','2027-06-14','2027-11-05','2027-12-31'],working:['2027-02-20']};
})(window);
