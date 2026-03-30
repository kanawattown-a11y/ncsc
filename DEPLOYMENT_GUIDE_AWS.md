# الدليل التشغيلي المتكامل: منظومة NCSC
## النطاق المعتمد: `ncsc.gov-bashan.org`
## البيئة: AWS Lightsail + RDS + S3 + PM2

هذا الدليل هو المرجع النهائي لنشر المنظومة بأداء مذهل وأمان فائق.

---

## المرحلة الأولى: إعداد قاعدة البيانات (AWS RDS PostgreSQL) 🗄️

تُعد هذه الخطوة الأهم لضمان بقاء البيانات في حال تعطل السيرفر.

1. **إنشاء الـ Instance:**
   - ادخل إلى لوحة تحكم AWS RDS واختر **Create Database**.
   - اختر **PostgreSQL** (الإصدار 14 أو أحدث).
   - الفئة: **Free Tier** أو **db.t3.micro** كبداية.
2. **إعدادات الدخول:**
   - الـ DB Instance Identifier: `ncsc-db`
   - اسم المستخدم (Master Username): `ncsc_admin`
   - كلمة المرور: (اختر كلمة مرور قوية جداً).
3. **الاتصال والأمان:**
   - **Public Access:** اختر **NO** (لحمايتها من الإنترنت).
   - **VPC Security Group:** أنشئ مجموعة جديدة تسمح بمرور البيانات عبر بورت **5432**.
4. **ربط Lightsail مع RDS (خطوة حرجة):**
   - اذهب إلى لوحة تحكم **Lightsail** -> **Account Settings** -> **Advanced**.
   - فعل خيار **VPC Peering** في المنطقة التي يتواجد فيها السيرفر (مثلاً Frankfurt). هذا يسمح للسيرفر "برؤية" قاعدة بيانات RDS داخلياً.

---

## المرحلة الثانية: إعداد التخزين (AWS S3) ☁️

1. **إنشاء الـ Bucket:**
   - انشئ Bucket خاص في S3 باسم `ncsc-security-archive`.
2. **قفل الوصول العام:**
   - فعل **Block all public access**. لن يتم فتح الملفات إلا عبر نظام التصاريح الذي برمجناه.
3. **مفاتيح الوصول (IAM):**
   - أنشئ User في IAM بصلاحية `S3FullAccess` لهذا الـ Bucket حصراً.
   - استخرج الـ `Access Key` والـ `Secret Key`.

---

## المرحلة الثالثة: تجهيز السيرفر (Lightsail Ubuntu) 🐧

1. **تحديث السيرفر وتثبيت Node.js:**
```bash
sudo apt-get update && sudo apt-get upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install pm2 -g
```

2. **جلب الكود والبناء:**
```bash
git clone https://github.com/kanawattown-a11y/ncsc.git
cd ncsc
npm install
```

3. **إعداد ملف البيئة (.env):**
   - الرابط يجب أن يكون بالتنسيق التالي للارتباط بـ RDS:
   `DATABASE_URL="postgresql://ncsc_admin:PASSWORD@RDS_ENDPOINT:5432/postgres"`
   *(استبدل RDS_ENDPOINT بالعنوان الموجود في لوحة تحكم RDS الـ Connectivity & security)*

---

## المرحله الرابعة: التشغيل والإدارة الفنية (بدون ملف إعداد) ⚡

1. **مزامنة الجداول:**
```bash
npx prisma generate
npx prisma db push
```

2. **البناء والبدء عبر PM2 (أوامر مباشرة):**
```bash
npm run build

# تشغيل النظام باسم ncsc-app
pm2 start npm --name "ncsc-app" -- start

# حفظ الحالة لضمان العمل بعد إعادة تشغيل السيرفر
pm2 save
pm2 startup
```

---

## المرحلة الخامسة: ربط النطاق والتشفير (Nginx + SSL) 🔒

لتوجيه الدومين إلى تطبيقك الذي يقرأ من بورت `3000`، يجب أن نجعل `Nginx` يعمل كـ (Reverse Proxy) ونقوم بتشفير الاتصال عبر `Certbot`.

1. **تثبيت Nginx و Certbot:**
```bash
sudo apt-get install nginx certbot python3-certbot-nginx -y
```

2. **تكوين Nginx:**
   افتح ملف خصائص جديد:
```bash
sudo nano /etc/nginx/sites-available/ncsc
```
   انسخ والصق الإعدادات التالية داخله:
```nginx
server {
    listen 80;
    server_name ncsc.gov-bashan.org;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

3. **تفعيل الإعدادات (Symlink):**
```bash
sudo ln -s /etc/nginx/sites-available/ncsc /etc/nginx/sites-enabled/
# التأكد من صحة الملفات
sudo nginx -t
# إعادة تشغيل Nginx
sudo systemctl restart nginx
```

4. **تفعيل شهادة الأمان (SSL):**
   هذا الأمر سيقوم بطلب وتسجيل شهادة مجانية رسمية للدومين وتعديل ملف `Nginx` لفرض الاتصال الآمن (HTTPS) تلقائياً:
```bash
sudo certbot --nginx -d ncsc.gov-bashan.org
```

---

> [!IMPORTANT]
> **قواعد الجدار الناري (Firewall):**
> تذكر الدخول للوحة تحكم Lightsail وتفعيل استقبال الطلبات على بورت **80 (HTTP)** وبورت **443 (HTTPS)** لتتمكن من الوصول للموقع. أغلق بورت 3000 تماماً عن الإنترنت لمزيد من الأمان.
