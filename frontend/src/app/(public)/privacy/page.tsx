import { getSettingsSafe } from '@/lib/api';

export const metadata = { title: 'Нууцлалын бодлого' };

export default async function PrivacyPage() {
  const settings = await getSettingsSafe();
  const company = settings.companyName || 'Victory Car';

  return (
    <div className="container-page py-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          Нууцлалын бодлого
        </h1>
        <p className="mt-2 text-sm text-gray-400">
          Сүүлд шинэчилсэн: 2026 оны 7-р сар
        </p>

        <div className="mt-8 space-y-8 text-gray-700">
          <section>
            <h2 className="text-lg font-semibold text-gray-900">1. Ерөнхий зүйл</h2>
            <p className="mt-2 leading-relaxed">
              Энэхүү нууцлалын бодлого нь {company}-ийн вэбсайт (victorycar.mn)
              болон түүнтэй холбоотой үйлчилгээг ашиглах үед таны мэдээллийг
              хэрхэн цуглуулж, ашиглаж, хамгаалдгийг тайлбарлана.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">
              2. Цуглуулдаг мэдээлэл
            </h2>
            <p className="mt-2 leading-relaxed">
              Та манай сайтаар зочлоход бүртгэл үүсгэх шаардлагагүй. Бид дараах
              мэдээллийг зөвхөн та өөрөө өгсөн тохиолдолд цуглуулна:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>Холбоо барих маягтаар илгээсэн нэр, утасны дугаар, зурвас</li>
              <li>Сонирхсон автомашины мэдээлэл</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">
              3. Мэдээллийн ашиглалт
            </h2>
            <p className="mt-2 leading-relaxed">
              Таны өгсөн мэдээллийг зөвхөн дараах зорилгоор ашиглана:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>Таны сонирхсон автомашины талаар эргэж холбогдох</li>
              <li>Худалдаа, зээлийн нөхцөлийн талаар мэдээлэл өгөх</li>
            </ul>
            <p className="mt-2 leading-relaxed">
              Бид таны хувийн мэдээллийг гуравдагч этгээдэд худалдахгүй,
              дамжуулахгүй.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">
              4. Мэдээллийн хадгалалт, хамгаалалт
            </h2>
            <p className="mt-2 leading-relaxed">
              Таны мэдээллийг найдвартай серверт хадгалж, зөвхөн эрх бүхий
              ажилтан хандах боломжтой. Та өөрийн мэдээллээ устгуулахыг хүсвэл
              бидэнтэй холбогдоорой.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">5. Күүки (Cookies)</h2>
            <p className="mt-2 leading-relaxed">
              Манай сайт хэрэглэгчийг мөшгих зорилготой күүки ашигладаггүй.
              Сайтын үндсэн ажиллагаанд шаардлагатай техникийн мэдээлэл л
              түр хадгалагдаж болно.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">6. Холбоо барих</h2>
            <p className="mt-2 leading-relaxed">
              Нууцлалын бодлоготой холбоотой асуулт байвал дараах сувгаар
              холбогдоно уу:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              {settings.contact.phone && <li>Утас: {settings.contact.phone}</li>}
              {settings.contact.email && <li>И-мэйл: {settings.contact.email}</li>}
              <li>Вэбсайт: victorycar.mn</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
