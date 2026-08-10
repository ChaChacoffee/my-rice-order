import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getFirestore, collection, query, orderBy, onSnapshot, doc, updateDoc } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { firebaseConfig, ADMIN_EMAIL } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const loginBox = document.getElementById("loginBox");
const adminBox = document.getElementById("adminBox");
const loginMessage = document.getElementById("loginMessage");
const ordersEl = document.getElementById("orders");
const summary = document.getElementById("summary");
const userEmail = document.getElementById("userEmail");

document.getElementById("loginBtn").onclick = async ()=>{
  loginMessage.textContent = "";
  try { await signInWithPopup(auth, provider); }
  catch(e){ console.error(e); loginMessage.textContent = "เข้าสู่ระบบไม่สำเร็จ"; }
};
document.getElementById("logoutBtn").onclick = ()=>signOut(auth);

function renderOrders(snap){
  const rows = snap.docs.map(d=>({id:d.id,...d.data()}));
  rows.sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
  const totalQty = rows.reduce((s,o)=>s+Number(o.quantity||0),0);
  const totalMoney = rows.reduce((s,o)=>s+Number(o.total||0),0);
  summary.textContent = `ทั้งหมด ${rows.length} ออเดอร์ • ${totalQty} ชุด • ${totalMoney.toLocaleString()} บาท`;
  ordersEl.innerHTML = rows.length ? rows.map(o=>`
    <article class="order">
      <h3>🍚 ${esc(o.customerName||"-")} — ${Number(o.total||0).toLocaleString()} บาท</h3>
      <div class="line">ข้าว: ${esc(o.riceType||"-")}</div>
      <div class="line">หน้า: ${esc((o.toppings||[]).join(" + ")||"-")}</div>
      <div class="line">แบบ: ${esc(o.packageType||"-")} × ${Number(o.quantity||0)}</div>
      <div class="line">📞 ${esc(o.phone||"-")}</div>
      <div class="line">📍 ${esc(o.address||"-")}</div>
      <div class="line">📝 ${esc(o.note||"-")}</div>
      <select data-id="${o.id}" class="status">
        ${["รอทำ","กำลังทำ","พร้อมส่ง","ส่งแล้ว","ยกเลิก"].map(s=>`<option ${s===o.orderStatus?"selected":""}>${s}</option>`).join("")}
      </select>
    </article>`).join("") : "<p>ยังไม่มีออเดอร์</p>";

  document.querySelectorAll(".status").forEach(sel=>{
    sel.onchange = async ()=>{
      await updateDoc(doc(db,"orders",sel.dataset.id), {orderStatus:sel.value});
    };
  });
}
function esc(v){
  return String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
}

let unsubscribe = null;
onAuthStateChanged(auth, user=>{
  if(unsubscribe){ unsubscribe(); unsubscribe=null; }
  if(!user){
    loginBox.classList.remove("hidden");
    adminBox.classList.add("hidden");
    return;
  }
  if(user.email !== ADMIN_EMAIL){
    loginBox.classList.remove("hidden");
    adminBox.classList.add("hidden");
    loginMessage.textContent = "บัญชีนี้ไม่มีสิทธิ์เป็นผู้ดูแล";
    signOut(auth);
    return;
  }
  loginBox.classList.add("hidden");
  adminBox.classList.remove("hidden");
  userEmail.textContent = user.email;
  const q = query(collection(db,"orders"), orderBy("createdAt","desc"));
  unsubscribe = onSnapshot(q, renderOrders, err=>{
    console.error(err);
    ordersEl.innerHTML = "<p>อ่านออเดอร์ไม่ได้ กรุณาตรวจสอบ Rules</p>";
  });
});
