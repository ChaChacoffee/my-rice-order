import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const form = document.getElementById("orderForm");
const packageType = document.getElementById("packageType");
const quantity = document.getElementById("quantity");
const total = document.getElementById("total");
const message = document.getElementById("message");
const submitBtn = document.getElementById("submitBtn");

function selectedToppings(){
  return [...document.querySelectorAll('input[name="topping"]:checked')].map(x=>x.value);
}
function updateTotal(){
  const price = Number(packageType.selectedOptions[0]?.dataset.price || 0);
  total.textContent = price * Math.max(1, Number(quantity.value || 1));
}
packageType.addEventListener("change", updateTotal);
quantity.addEventListener("input", updateTotal);

form.addEventListener("submit", async (e)=>{
  e.preventDefault();
  message.textContent = "";
  const riceType = document.querySelector('input[name="riceType"]:checked')?.value;
  const toppings = selectedToppings();
  const pack = packageType.value;
  const toppingLimit = pack === "ปกติ 1 อย่าง" ? 1 : pack === "ปกติ 2 อย่าง" ? 2 : null;

  if (!riceType) return message.textContent = "กรุณาเลือกชนิดข้าว";
  if (!toppings.length) return message.textContent = "กรุณาเลือกหน้าอย่างน้อย 1 อย่าง";
  if (toppingLimit && toppings.length !== toppingLimit)
    return message.textContent = `เมนู ${pack} ต้องเลือกหน้า ${toppingLimit} อย่าง`;
  if (!toppingLimit && toppings.length > 2)
    return message.textContent = "กรุณาเลือกหน้าไม่เกิน 2 อย่าง";

  const qty = Math.max(1, Number(quantity.value || 1));
  const price = Number(packageType.selectedOptions[0].dataset.price);
  const order = {
    customerName: document.getElementById("customerName").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    address: document.getElementById("address").value.trim(),
    note: document.getElementById("note").value.trim(),
    riceType,
    toppings,
    packageType: pack,
    quantity: qty,
    unitPrice: price,
    total: price * qty,
    paymentStatus: "รอตรวจสอบ",
    orderStatus: "รอทำ",
    createdAt: serverTimestamp()
  };

  submitBtn.disabled = true;
  submitBtn.textContent = "กำลังส่งออเดอร์...";
  try{
    const ref = await addDoc(collection(db, "orders"), order);
    message.textContent = `รับออเดอร์แล้ว #${ref.id.slice(-6).toUpperCase()} ขอบคุณครับ`;
    form.reset();
    quantity.value = 1;
    total.textContent = "0";
  }catch(err){
    console.error(err);
    message.textContent = "ส่งออเดอร์ไม่สำเร็จ กรุณาลองใหม่";
  }finally{
    submitBtn.disabled = false;
    submitBtn.textContent = "✅ ยืนยันออเดอร์";
  }
});
