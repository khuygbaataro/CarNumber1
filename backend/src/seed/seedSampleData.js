require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Vehicle = require('../models/Vehicle');
const Settings = require('../models/Settings');

/**
 * Seeds demo content (settings + a few vehicles) so a freshly deployed
 * site isn't empty. Safe to re-run: it only fills in data that is missing.
 * Placeholder images use placehold.co — replace them via the admin panel.
 *
 * Run with: npm run seed:sample
 */

const img = (text, bg = '0b3d91') =>
  `https://placehold.co/800x600/${bg}/ffffff?text=${encodeURIComponent(text)}`;

const sampleVehicles = [
  {
    brand: 'Toyota',
    model: 'Prius 30',
    year: 2015,
    price: 18000000,
    mileage: 120000,
    engine: '1.8L Hybrid',
    exteriorColor: 'Цагаан',
    interiorColor: 'Хар',
    description:
      'Маш хэмнэлттэй, найдвартай хайбрид машин. Хотын нөхцөлд тохиромжтой.',
    images: [img('Toyota Prius'), img('Prius - 2', '1e56c4'), img('Prius - 3', '072a66')],
    status: 'available',
    featured: true,
  },
  {
    brand: 'Lexus',
    model: 'RX 350',
    year: 2013,
    price: 35000000,
    mileage: 145000,
    engine: '3.5L V6',
    exteriorColor: 'Хар',
    interiorColor: 'Шаргал',
    description: 'Тансаг зэрэглэлийн зөөлөн явдалтай кроссовер. Бүрэн тохижилттой.',
    images: [img('Lexus RX350'), img('RX350 - 2', '1e56c4')],
    status: 'available',
    featured: true,
  },
  {
    brand: 'Toyota',
    model: 'Land Cruiser 200',
    year: 2018,
    price: 120000000,
    mileage: 90000,
    engine: '4.6L V8',
    exteriorColor: 'Хөх',
    interiorColor: 'Бор',
    description: 'Хүчирхэг, эвдрэлгүй жийп. Хот хөдөө хаана ч тохиромжтой.',
    images: [img('Land Cruiser 200'), img('LC200 - 2', '1e56c4')],
    status: 'available',
    featured: true,
  },
  {
    brand: 'Hyundai',
    model: 'Sonata',
    year: 2016,
    price: 25000000,
    mileage: 98000,
    engine: '2.0L',
    exteriorColor: 'Саарал',
    interiorColor: 'Хар',
    description: 'Цэвэрхэн, шинэлэг загвартай седан. Гэр бүлд тохиромжтой.',
    images: [img('Hyundai Sonata')],
    status: 'available',
    featured: false,
  },
  {
    brand: 'Toyota',
    model: 'Camry',
    year: 2014,
    price: 22000000,
    mileage: 130000,
    engine: '2.5L',
    exteriorColor: 'Мөнгөлөг',
    interiorColor: 'Хар',
    description: 'Найдвартай, өргөн дэлгэр седан. Зарагдсан.',
    images: [img('Toyota Camry')],
    status: 'sold',
    featured: false,
  },
  {
    brand: 'Honda',
    model: 'Fit',
    year: 2017,
    price: 19500000,
    mileage: 76000,
    engine: '1.3L Hybrid',
    exteriorColor: 'Улаан',
    interiorColor: 'Хар',
    description: 'Жижиг, авсаархан, хэмнэлттэй. Анхны жолоочид тохиромжтой.',
    images: [img('Honda Fit')],
    status: 'available',
    featured: false,
  },
];

const sampleSettings = {
  companyName: 'Авто Дилер',
  banner: img('АВТО ДИЛЕР', '072a66'),
  contact: {
    phone: '+976 9911-2233',
    email: 'info@dealership.mn',
    address: 'Улаанбаатар хот, Сүхбаатар дүүрэг, Энх тайвны өргөн чөлөө',
  },
  social: {
    facebook: 'https://facebook.com',
    instagram: 'https://instagram.com',
    youtube: '',
  },
  loan: {
    minDownPercent: 30,
    monthlyInterestRate: 2.8,
    termOptions: [12, 24, 36],
  },
};

(async () => {
  try {
    await connectDB();

    const settings = await Settings.getSingleton();
    if (!settings.contact?.phone) {
      settings.companyName = sampleSettings.companyName;
      settings.banner = sampleSettings.banner;
      settings.contact = sampleSettings.contact;
      settings.social = sampleSettings.social;
      settings.loan = sampleSettings.loan;
      await settings.save();
      console.log('✅ Жишээ тохиргоо нэмэгдлээ.');
    } else {
      console.log('ℹ️  Тохиргоо аль хэдийн бөглөгдсөн тул алгассан.');
    }

    const count = await Vehicle.countDocuments();
    if (count === 0) {
      await Vehicle.insertMany(sampleVehicles);
      console.log(`✅ ${sampleVehicles.length} жишээ машин нэмэгдлээ.`);
    } else {
      console.log(`ℹ️  ${count} машин аль хэдийн байгаа тул алгассан.`);
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error(`❌ Алдаа: ${error.message}`);
    process.exit(1);
  }
})();
