# دليل النشر الميداني الشامل: منظومة NCSC
## النطاق المعتمد: `ncsc.gov-bashan.org`

هذا الدليل مخصص للفريق التقني المسؤول عن نشر المنظومة الأمنية لدولة جبل باشان على سحابة AWS. تم تصميم الخطوات لضمان أعلى مستويات الأمان (Hardened Security).

---

## المرحلة الأولى: إعداد قاعدة البيانات (AWS RDS PostgreSQL)

1. **إنشاء قاعدة البيانات:**
   - اختر **Standard Create** ثم **PostgreSQL**.
   - الإصدار الموصى به: **PostgreSQL 14** أو أحدث.
   - الفئة: **Free Tier** أو **db.t3.micro** (حسب ميزانية Lightsail).
2. **الإعدادات:**
   - Master Username: `ncsc_admin`
   - Master Password: (اختر كلمة مرور معقدة جداً).
3. **الاتصال بالشبكة (VPC):**
   - تأكد من تفعيل **Public Access: NO**.
   - سنقوم لاحقاً بربط Lightsail بـ VPC الخاص بـ RDS عبر **VPC Peering** في إعدادات Lightsail.

---

## المرحلة الثانية: إعداد التخزين السحابي (AWS S3)

1. **إنشاء Bucket:**
   - الاسم: `ncsc-citizen-documents-secure` (أو أي اسم تختاره).
   - المنطقة: نفس منطقة Lightsail (مثال: `me-central-1`).
2. **الأمان (Block Public Access):**
   - **تفعيل** خيار "Block all public access" (مهم جداً). لن يتم الوصول للملفات إلا عبر الروابط المشفرة (Presigned URLs).
3. **صلاحيات IAM:**
   - أنشئ مستخدم جديد في IAM يسمى `ncsc-app-user`.
   - أعطه صلاحية `AmazonS3FullAccess` لهذا الـ Bucket فقط.
   - احفظ الـ **Access Key ID** والـ **Secret Access Key**.

---

## المرحلة الثالثة: إعداد الاستضافة (AWS Lightsail)

1. **إنشاء Instance:**
   - الصورة: **OS Only** -> **Ubuntu 22.04 LTS**.
   - الخطة: يفضل 1GB RAM أو أكثر لضمان سلاسة بناء الـ Docker.
2. **تجهيز السيرفر (Command Line):**
   اتصل بالسيرفر عبر Terminal ونفذ الأوامر التالية:

```bash
# تحديث السيرفر
sudo apt-get update && sudo apt-get upgrade -y

# تثبيت Docker و Docker Compose
sudo apt-get install docker.io docker-compose -y
sudo systemctl start docker
sudo systemctl enable docker

# السماح للمستخدم الحالي بتشغيل Docker
sudo usermod -aG docker $USER
# (أغلق الجلسة وأعد الدخول لتفعيل تغيير اليوزر)
```

---

## المرحلة الرابعة: ربط الدومين وشهادة SSL

1. **توجيه الدومين:**
   - في لوحة تحكم `gov-bashan.org` (Route 53 أو موفر الدومين)، أنشئ سجل **A Record** للدومين الفرعي `ncsc` يشير إلى الـ **Static IP** الخاص بـ Lightsail.
2. **تثبيت Nginx & Certbot للحماية:**
```bash
sudo apt-get install nginx certbot python3-certbot-nginx -y
```
3. **إعداد Nginx ليكون Proxy (لإخفاء البورت 3000):**
   أنشئ ملف إعداد: `sudo nano /etc/nginx/sites-available/ncsc`
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
4. **تفعيل الشهادة:**
```bash
sudo ln -s /etc/nginx/sites-available/ncsc /etc/nginx/sites-enabled/
sudo certbot --nginx -d ncsc.gov-bashan.org
```

---

## المرحلة الخامسة: تشغيل المنظومة (Deployment)

1. **جلب الكود للسيرفر:**
   - ارفع ملفات المشروع (ما عدا node_modules و .git).
2. **إعداد البيئة:**
   - انسخ ملف `.env.example` إلى `.env`.
   - عبي البيانات الحقيقية:
```env
DATABASE_URL="postgresql://ncsc_admin:PASSWORD@RDS_ENDPOINT:5432/postgres"
NEXTAUTH_SECRET="قم_بتوليد_مفتاح_طويل_جدا_هنا"
NEXTAUTH_URL="https://ncsc.gov-bashan.org"

AWS_REGION="me-central-1"
AWS_ACCESS_KEY_ID="مفتاح_IAM"
AWS_SECRET_ACCESS_KEY="المفتاح_السري_IAM"
AWS_S3_BUCKET_NAME="اسم_الـ_Bucket"
```
3. **البناء والتشغيل:**
```bash
# بناء الحاوية وتشغيلها في الخلفية
docker-compose up -d --build

# تنفيذ الهجرة لقاعدة البيانات (أول مرة فقط)
docker exec -it ncsc-production npx prisma db push
```

---

## ملاحظات أمنية (Extreme Hardening)
- **VPC Peering:** في لوحة تحكم Lightsail، اذهب إلى `Account -> Advanced` وفعل **VPC Peering** للتواصل مع RDS داخلياً دون الحاجة لفتح البورت 5432 للإنترنت العام.
- **Firewall:** في Lightsail Firewall، افتح فقط بورت **80 (HTTP)** و **443 (HTTPS)** و **22 (SSH)**. أغلق أي بورتات أخرى.

> [!CAUTION]
> لا تشارك ملف `.env` مع أي جهة غير مخولة. هذا الملف يحتوي على مفاتيح الدخول المباشر لقاعدة البيانات وملفات المواطنين.
