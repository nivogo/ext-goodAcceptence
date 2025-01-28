# Nivo ext-goodAcceptence

Bu proje, **Nivo** bünyesinde **şirket içi** kullanım amacıyla geliştirilen bir **QR kod** tarama ve yönetim uygulamasıdır. Mağaza bazlı sevkiyatların **ön kabul** ve **mal kabul** süreçlerini yönetmek, rapor almak ve kullanıcı bilgilendirmelerini sağlamak için tasarlanmıştır.

---

## İçindekiler

- [Proje Hakkında](#proje-hakkında)
- [Teknolojiler](#teknolojiler)
- [Deployment ve Secret Yönetimi](#deployment-ve-secret-yönetimi)

---

## Proje Hakkında

1. **Kullanıcı Kimlik Doğrulama (AuthContext)**  
   - Şirket içi kullanıcılar e-posta ve şifre (Firebase Auth) ile giriş yapar.  
   - Mağaza bilgileri (ör. `storeName`, `PAAD_ID`) ve kullanıcı profili bilgileri saklanır.

2. **Ön Kabul (onKabul) & Mal Kabul (malKabul)**  
   - **Ön Kabul**: Doğru mağazaya ait olmayan kolileri tespit eder veya kolileri "Okutma Başarılı" olarak işaretler.  
   - **Mal Kabul**: Başarılı kolilerin mal kabul süreçlerini onaylar ve verileri günceller.

3. **Başarılı Koliler (basariliKoliler)**  
   - "Okutma Başarılı" durumundaki kolilerin detaylı listesini gösterir.

4. **Rapor (rapor)**  
   - Sevkiyat verilerinin tamamını listeler, Excel dosyası halinde indirme olanağı sunar.

5. **Bildirim Sistemi (NotificationContext)**  
   - Başarılı veya hatalı işlemlerde ekranda anlık bildirim (toast) gösterir.

6. **Kullanıcı Dostu Giriş ve Terminal Desteği**  
   - `FocusLockInput` bileşeniyle mobil cihazlar veya el terminallerinde sürekli caret (imleç) ve odak yönetimi yapılır.  
   - Dinamik tablo ve formlar sayesinde veri girişi kolaylaşır.

---

## Teknolojiler

- **React** (18+)
- **Next.js** (13+)
- **Firebase** (Authentication, Firestore)
- **XLSX** (Excel dosyası oluşturma)
- **CSS Modülleri** (Stil yönetimi)

---

## Deployment ve Secret Yönetimi

Bu projede, **Vercel** platformu ve **Environment Secret** (gizli değişken) yönetimi kullanılmıştır. Firebase yapılandırması için gereken anahtarlar (`NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `GOOGLE_APPLICATION_CREDENTIALS` vb.) ve diğer gizli bilgiler, **Vercel** üzerinde proje bazında tanımlanan environment variables aracılığıyla güvenle saklanır. Her bir sürüm veya ortamda (development, preview, production) farklı environment değişkenleri yönetilir.

Proje, **Next.js** tabanlı olması sayesinde **Vercel** ile doğal olarak entegre çalışır. Commit işlemleri sonrasında otomatik olarak tetiklenen build ve deploy süreçleri, tanımlı environment secret’lar yardımıyla uygulamanın güvenli ve sorunsuz şekilde dağıtılmasını sağlar. Böylece hem sürüm kontrolü hem de devamlı entegrasyon akışı proje içerisinde kolaylıkla yönetilir.

---
