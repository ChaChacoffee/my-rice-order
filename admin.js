import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

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


// =========================
// LOGIN
// =========================

document.getElementById("loginBtn").onclick = async () => {
  loginMessage.textContent = "";

  try {
    await signInWithPopup(auth, provider);
  } catch (e) {
    console.error(e);
    loginMessage.textContent = "เข้าสู่ระบบไม่สำเร็จ";
  }
};


document.getElementById("logoutBtn").onclick = () => {
  signOut(auth);
};


// =========================
// แสดงออเดอร์
// =========================

function renderOrders(snap) {

  const rows = snap.docs.map(d => ({
    id: d.id,
    ...d.data()
  }));

  rows.sort(
    (a, b) =>
      (b.createdAt?.seconds || 0) -
      (a.createdAt?.seconds || 0)
  );


  const totalQty = rows.reduce(
    (s, o) => s + Number(o.quantity || 0),
    0
  );

  const totalMoney = rows.reduce(
    (s, o) => s + Number(o.total || 0),
    0
  );


  summary.textContent =
    `ทั้งหมด ${rows.length} ออเดอร์ • ${totalQty} ชุด • ${totalMoney.toLocaleString()} บาท`;


  ordersEl.innerHTML = rows.length
    ? rows.map(o => createOrderHTML(o)).join("")
    : "<p>ยังไม่มีออเดอร์</p>";


  // =========================
  // ปุ่มเปลี่ยนสถานะ
  // =========================

  document.querySelectorAll(".status").forEach(sel => {

    sel.onchange = async () => {

      try {

        await updateDoc(
          doc(db, "orders", sel.dataset.id),
          {
            orderStatus: sel.value
          }
        );

      } catch (e) {

        console.error(e);
        alert("เปลี่ยนสถานะไม่สำเร็จ");

      }

    };

  });


  // =========================
  // ปุ่มแก้ไข
  // =========================

  document.querySelectorAll(".editBtn").forEach(btn => {

    btn.onclick = () => {

      const id = btn.dataset.id;

      const order = rows.find(o => o.id === id);

      if (order) {
        showEditForm(order);
      }

    };

  });


  // =========================
  // ปุ่มลบ
  // =========================

  document.querySelectorAll(".deleteBtn").forEach(btn => {

    btn.onclick = async () => {

      const id = btn.dataset.id;

      const ok = confirm(
        "ยืนยันการลบออเดอร์นี้ใช่ไหม?\n\nเมื่อลบแล้วจะไม่สามารถกู้คืนได้"
      );

      if (!ok) return;


      try {

        await deleteDoc(
          doc(db, "orders", id)
        );

        alert("ลบออเดอร์เรียบร้อยแล้ว");

      } catch (e) {

        console.error(e);
        alert("ลบออเดอร์ไม่สำเร็จ");

      }

    };

  });

}


// =========================
// สร้าง HTML ออเดอร์
// =========================

function createOrderHTML(o) {

  return `
    <article class="order">

      <h3>
        🍚 ${esc(o.customerName || "-")}
        — ${Number(o.total || 0).toLocaleString()} บาท
      </h3>

      <div class="line">
        ข้าว: ${esc(o.riceType || "-")}
      </div>

      <div class="line">
        หน้า: ${esc(
          (o.toppings || []).join(" + ") || "-"
        )}
      </div>

      <div class="line">
        แบบ: ${esc(o.packageType || "-")}
        × ${Number(o.quantity || 0)}
      </div>

      <div class="line">
        📞 ${esc(o.phone || "-")}
      </div>

      <div class="line">
        📍 ${esc(o.address || "-")}
      </div>

      <div class="line">
        📝 ${esc(o.note || "-")}
      </div>

      <div class="line">
        สถานะ:
      </div>

      <select
        data-id="${o.id}"
        class="status"
      >
        ${[
          "รอทำ",
          "กำลังทำ",
          "พร้อมส่ง",
          "ส่งแล้ว",
          "ยกเลิก"
        ].map(s => `
          <option
            ${s === o.orderStatus ? "selected" : ""}
          >
            ${s}
          </option>
        `).join("")}
      </select>


      <div style="
        display:flex;
        gap:10px;
        margin-top:15px;
        flex-wrap:wrap;
      ">

        <button
          class="editBtn"
          data-id="${o.id}"
          type="button"
        >
          ✏️ แก้ไขออเดอร์
        </button>

        <button
          class="deleteBtn"
          data-id="${o.id}"
          type="button"
          style="
            background:#d32f2f;
            color:white;
          "
        >
          🗑️ ลบออเดอร์
        </button>

      </div>

    </article>
  `;
}


// =========================
// ฟอร์มแก้ไข
// =========================

function showEditForm(o) {

  const oldForm = document.getElementById("editOrderForm");

  if (oldForm) {
    oldForm.remove();
  }


  const form = document.createElement("div");

  form.id = "editOrderForm";

  form.style.cssText = `
    position:fixed;
    inset:0;
    background:rgba(0,0,0,.75);
    display:flex;
    align-items:center;
    justify-content:center;
    z-index:9999;
    padding:20px;
  `;


  form.innerHTML = `

    <div style="
      background:white;
      color:#111;
      width:100%;
      max-width:600px;
      max-height:90vh;
      overflow:auto;
      border-radius:16px;
      padding:20px;
      box-sizing:border-box;
    ">

      <h2>✏️ แก้ไขออเดอร์</h2>


      <label>ชื่อลูกค้า</label>
      <input
        id="editCustomerName"
        value="${escAttr(o.customerName || "")}"
        style="${inputStyle()}"
      >


      <label>ข้าว</label>
      <input
        id="editRiceType"
        value="${escAttr(o.riceType || "")}"
        style="${inputStyle()}"
      >


      <label>หน้า</label>
      <input
        id="editToppings"
        value="${escAttr((o.toppings || []).join(", "))}"
        placeholder="เช่น หมู, ไข่ดาว"
        style="${inputStyle()}"
      >


      <label>แบบบรรจุ</label>
      <input
        id="editPackageType"
        value="${escAttr(o.packageType || "")}"
        style="${inputStyle()}"
      >


      <label>จำนวน</label>
      <input
        id="editQuantity"
        type="number"
        min="1"
        value="${Number(o.quantity || 1)}"
        style="${inputStyle()}"
      >


      <label>ราคา/ยอดรวม</label>
      <input
        id="editTotal"
        type="number"
        min="0"
        value="${Number(o.total || 0)}"
        style="${inputStyle()}"
      >


      <label>เบอร์โทร</label>
      <input
        id="editPhone"
        value="${escAttr(o.phone || "")}"
        style="${inputStyle()}"
      >


      <label>ที่อยู่</label>
      <textarea
        id="editAddress"
        style="${textareaStyle()}"
      >${esc(o.address || "")}</textarea>


      <label>หมายเหตุ</label>
      <textarea
        id="editNote"
        style="${textareaStyle()}"
      >${esc(o.note || "")}</textarea>


      <label>สถานะ</label>

      <select
        id="editStatus"
        style="${inputStyle()}"
      >

        ${[
          "รอทำ",
          "กำลังทำ",
          "พร้อมส่ง",
          "ส่งแล้ว",
          "ยกเลิก"
        ].map(s => `
          <option
            value="${escAttr(s)}"
            ${s === o.orderStatus ? "selected" : ""}
          >
            ${s}
          </option>
        `).join("")}

      </select>


      <div style="
        display:flex;
        gap:10px;
        margin-top:20px;
      ">

        <button
          id="saveEditBtn"
          type="button"
          style="
            flex:1;
            background:#198754;
            color:white;
          "
        >
          💾 บันทึก
        </button>

        <button
          id="cancelEditBtn"
          type="button"
          style="
            flex:1;
          "
        >
          ยกเลิก
        </button>

      </div>

    </div>
  `;


  document.body.appendChild(form);


  // =========================
  // ยกเลิก
  // =========================

  document.getElementById("cancelEditBtn").onclick = () => {
    form.remove();
  };


  // =========================
  // บันทึก
  // =========================

  document.getElementById("saveEditBtn").onclick =
    async () => {

      const saveBtn =
        document.getElementById("saveEditBtn");

      saveBtn.disabled = true;
      saveBtn.textContent = "กำลังบันทึก...";


      try {

        const toppingsText =
          document.getElementById("editToppings").value;


        const toppings =
          toppingsText
            .split(",")
            .map(x => x.trim())
            .filter(Boolean);


        const updateData = {

          customerName:
            document.getElementById("editCustomerName").value.trim(),

          riceType:
            document.getElementById("editRiceType").value.trim(),

          toppings: toppings,

          packageType:
            document.getElementById("editPackageType").value.trim(),

          quantity:
            Number(
              document.getElementById("editQuantity").value
            ),

          total:
            Number(
              document.getElementById("editTotal").value
            ),

          phone:
            document.getElementById("editPhone").value.trim(),

          address:
            document.getElementById("editAddress").value.trim(),

          note:
            document.getElementById("editNote").value.trim(),

          orderStatus:
            document.getElementById("editStatus").value
        };


        await updateDoc(
          doc(db, "orders", o.id),
          updateData
        );


        form.remove();

        alert("แก้ไขออเดอร์เรียบร้อยแล้ว");


      } catch (e) {

        console.error(e);

        alert(
          "แก้ไขไม่สำเร็จ\n\n" +
          "กรุณาตรวจสอบ Firestore Rules"
        );

        saveBtn.disabled = false;
        saveBtn.textContent = "💾 บันทึก";

      }

    };

}


// =========================
// รูปแบบช่องกรอก
// =========================

function inputStyle() {

  return `
    width:100%;
    box-sizing:border-box;
    padding:10px;
    margin:6px 0 14px;
    border:1px solid #ccc;
    border-radius:8px;
    font-size:16px;
  `;

}


function textareaStyle() {

  return `
    width:100%;
    min-height:80px;
    box-sizing:border-box;
    padding:10px;
    margin:6px 0 14px;
    border:1px solid #ccc;
    border-radius:8px;
    font-size:16px;
  `;

}


// =========================
// ป้องกัน HTML แปลกปลอม
// =========================

function esc(v) {

  return String(v).replace(
    /[&<>"']/g,
    m => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[m])
  );

}


function escAttr(v) {

  return esc(v);

}


// =========================
// AUTH
// =========================

let unsubscribe = null;


onAuthStateChanged(auth, user => {

  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }


  if (!user) {

    loginBox.classList.remove("hidden");
    adminBox.classList.add("hidden");

    return;
  }


  if (user.email !== ADMIN_EMAIL) {

    loginBox.classList.remove("hidden");
    adminBox.classList.add("hidden");

    loginMessage.textContent =
      "บัญชีนี้ไม่มีสิทธิ์เป็นผู้ดูแล";

    signOut(auth);

    return;
  }


  loginBox.classList.add("hidden");
  adminBox.classList.remove("hidden");

  userEmail.textContent = user.email;


  const q = query(
    collection(db, "orders"),
    orderBy("createdAt", "desc")
  );


  unsubscribe = onSnapshot(
    q,
    renderOrders,
    err => {

      console.error(err);

      ordersEl.innerHTML =
        "<p>อ่านออเดอร์ไม่ได้ กรุณาตรวจสอบ Rules</p>";

    }
  );

});
