ระบบสั่งข้าวเหนียว + Firebase

ไฟล์:
- index.html = หน้าลูกค้า
- admin.html = หน้าครอบครัวจัดการออเดอร์
- firebase-config.js = ใส่ Firebase config และอีเมลผู้ดูแล
- app.js / admin.js = ระบบ
- style.css = หน้าตา

ก่อนใช้งาน:
1. Firebase Console > Project settings > Your apps > Web app
2. คัดลอก firebaseConfig ใส่ใน firebase-config.js
3. ใส่อีเมล Google ผู้ดูแลใน ADMIN_EMAIL
4. Authentication ต้องเปิด Google
5. Firestore collection ชื่อ orders
6. Firestore Rules ต้องเป็นกฎที่ตั้งไว้ก่อนหน้านี้

หมายเหตุ:
- หน้าเว็บลูกค้าส่งออเดอร์ได้โดยไม่ต้องล็อกอิน
- หน้า admin ต้องล็อกอิน Google ด้วยอีเมลที่ตรงกับ Rules
