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

import {
  firebaseConfig,
  ADMIN_EMAILS
} from "./firebase-config.js";


// =====================================================
// FIREBASE
// =====================================================

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

const auth = getAuth(app);

const provider = new GoogleAuthProvider();


// =====================================================
// ELEMENTS
// =====================================================

const loginBox =
  document.getElementById("loginBox");

const adminBox =
  document.getElementById("adminBox");

const loginBtn =
  document.getElementById("loginBtn");

const logoutBtn =
  document.getElementById("logoutBtn");

const loginMessage =
  document.getElementById("loginMessage");

const ordersEl =
  document.getElementById("orders");

const summary =
  document.getElementById("summary");

const userEmail =
  document.getElementById("userEmail");


// =====================================================
// ตรวจสอบ ADMIN
// =====================================================

function isAdmin(email) {

  if (!email) {
    return false;
  }

  return ADMIN_EMAILS
    .map(email => email.trim().toLowerCase())
    .includes(
      email.trim().toLowerCase()
    );
}


// =====================================================
// LOGIN GOOGLE
// =====================================================

loginBtn.addEventListener(
  "click",
  async () => {

    loginMessage.textContent =
      "กำลังเข้าสู่ระบบ...";

    loginBtn.disabled = true;

    try {

      await signInWithPopup(
        auth,
        provider
      );

    } catch (error) {

      console.error(
        "LOGIN ERROR:",
        error
      );

      loginMessage.textContent =
        "เข้าสู่ระบบไม่สำเร็จ: " +
        error.message;

      loginBtn.disabled = false;

    }

  }
);


// =====================================================
// LOGOUT
// =====================================================

logoutBtn.addEventListener(
  "click",
  async () => {

    try {

      await signOut(auth);

    } catch (error) {

      console.error(error);

    }

  }
);


// =====================================================
// AUTH STATE
// =====================================================

let unsubscribe = null;


onAuthStateChanged(
  auth,
  async user => {

    console.log(
      "AUTH USER:",
      user
    );


    // หยุด listener เก่า

    if (unsubscribe) {

      unsubscribe();

      unsubscribe = null;

    }


    // ===============================================
    // ยังไม่ได้ login
    // ===============================================

    if (!user) {

      loginBox.classList.remove(
        "hidden"
      );

      adminBox.classList.add(
        "hidden"
      );

      loginBtn.disabled = false;

      loginMessage.textContent = "";

      return;

    }


    // ===============================================
    // ตรวจสอบสิทธิ์
    // ===============================================

    console.log(
      "LOGIN EMAIL:",
      user.email
    );


    if (!isAdmin(user.email)) {

      loginBox.classList.remove(
        "hidden"
      );

      adminBox.classList.add(
        "hidden"
      );

      loginMessage.textContent =
        "บัญชี " +
        user.email +
        " ไม่มีสิทธิ์เป็นผู้ดูแล";


      await signOut(auth);

      loginBtn.disabled = false;

      return;

    }


    // ===============================================
    // เป็น ADMIN
    // ===============================================

    loginBox.classList.add(
      "hidden"
    );

    adminBox.classList.remove(
      "hidden"
    );


    userEmail.textContent =
      "ผู้ดูแล: " + user.email;


    // ===============================================
    // โหลดออเดอร์
    // ===============================================

    const ordersQuery = query(
      collection(
        db,
        "orders"
      ),
      orderBy(
        "createdAt",
        "desc"
      )
    );


    unsubscribe = onSnapshot(
      ordersQuery,

      snapshot => {

        renderOrders(snapshot);

      },

      error => {

        console.error(
          "FIRESTORE ERROR:",
          error
        );

        ordersEl.innerHTML = `
          <p>
            ❌ อ่านออเดอร์ไม่ได้
          </p>

          <p>
            ${esc(error.message)}
          </p>
        `;

      }
    );

  }
);


// =====================================================
// แสดงออเดอร์
// =====================================================

function renderOrders(snapshot) {

  const orders =
    snapshot.docs.map(
      document => ({
        id: document.id,
        ...document.data()
      })
    );


  const totalQty =
    orders.reduce(
      (sum, order) =>
        sum +
        getOrderQuantity(order),
      0
    );


  const totalMoney =
    orders.reduce(
      (sum, order) =>
        sum +
        Number(order.total || 0),
      0
    );


  summary.textContent =
    `ทั้งหมด ${orders.length} ออเดอร์ • ` +
    `${totalQty} ชุด • ` +
    `${totalMoney.toLocaleString()} บาท`;


  if (!orders.length) {

    ordersEl.innerHTML =
      "<p>ยังไม่มีออเดอร์</p>";

    return;

  }


  ordersEl.innerHTML =
    orders
      .map(order =>
        createOrderHTML(order)
      )
      .join("");


  // ===============================================
  // สถานะ
  // ===============================================

  document
    .querySelectorAll(".status")
    .forEach(select => {

      select.addEventListener(
        "change",
        async () => {

          try {

            await updateDoc(
              doc(
                db,
                "orders",
                select.dataset.id
              ),
              {
                orderStatus:
                  select.value
              }
            );

          } catch (error) {

            console.error(error);

            alert(
              "เปลี่ยนสถานะไม่สำเร็จ"
            );

          }

        }
      );

    });


  // ===============================================
  // ลบ
  // ===============================================

  document
    .querySelectorAll(".deleteBtn")
    .forEach(button => {

      button.addEventListener(
        "click",
        async () => {

          const ok =
            confirm(
              "ยืนยันลบออเดอร์นี้?"
            );

          if (!ok) {
            return;
          }


          try {

            await deleteDoc(
              doc(
                db,
                "orders",
                button.dataset.id
              )
            );

          } catch (error) {

            console.error(error);

            alert(
              "ลบออเดอร์ไม่สำเร็จ"
            );

          }

        }
      );

    });

}


// =====================================================
// ดึงรายการ
// =====================================================

function getOrderItems(order) {

  if (
    Array.isArray(order.items) &&
    order.items.length
  ) {

    return order.items;

  }


  return [
    {
      riceType:
        order.riceType || "",

      toppings:
        order.toppings || [],

      packageType:
        order.packageType || "",

      quantity:
        Number(order.quantity || 0),

      unitPrice:
        Number(order.total || 0) /
        Math.max(
          Number(order.quantity || 1),
          1
        ),

      lineTotal:
        Number(order.total || 0)
    }
  ];

}


// =====================================================
// จำนวน
// =====================================================

function getOrderQuantity(order) {

  return getOrderItems(order)
    .reduce(
      (sum, item) =>
        sum +
        Number(item.quantity || 0),
      0
    );

}


// =====================================================
// สร้างออเดอร์
// =====================================================

function createOrderHTML(order) {

  const items =
    getOrderItems(order);


  const itemsHTML =
    items.map(
      (item, index) => {

        const toppings =
          Array.isArray(item.toppings)
            ? item.toppings
            : [];


        const quantity =
          Number(item.quantity || 0);


        const lineTotal =
          Number(
            item.lineTotal ||
            (
              Number(item.unitPrice || 0) *
              quantity
            )
          );


        return `

          <div
            style="
              margin-top:12px;
              padding:14px;
              border:1px solid #ddd;
              border-radius:12px;
              background:#fafafa;
            "
          >

            <strong>
              🍚 รายการที่ ${index + 1}
            </strong>

            <div class="line">
              🍚 ข้าว:
              ${esc(item.riceType || "-")}
            </div>

            <div class="line">
              🥩 หน้า:
              ${esc(
                toppings.join(" + ") || "-"
              )}
            </div>

            <div class="line">
              📦 แบบ:
              ${esc(
                item.packageType || "-"
              )}
            </div>

            <div class="line">
              🔢 จำนวน:
              ${quantity}
            </div>

            <div class="line">
              💰 รายการนี้:
              ${lineTotal.toLocaleString()}
              บาท
            </div>

          </div>

        `;

      }
    ).join("");


  return `

    <article class="order">

      <h3>
        🍚 ${esc(
          order.customerName || "-"
        )}
        —
        ${Number(
          order.total || 0
        ).toLocaleString()}
        บาท
      </h3>


      ${itemsHTML}


      <div class="line">
        📦 รวม:
        ${getOrderQuantity(order)}
        ชุด
      </div>


      <div class="line">
        📞 ${esc(
          order.phone || "-"
        )}
      </div>


      <div class="line">
        📍 ${esc(
          order.address || "-"
        )}
      </div>


      <div class="line">
        📝 ${esc(
          order.note || "-"
        )}
      </div>


      <div class="line">
        สถานะ:
      </div>


      <select
        class="status"
        data-id="${order.id}"
      >

        ${[
          "รอทำ",
          "กำลังทำ",
          "พร้อมส่ง",
          "ส่งแล้ว",
          "ยกเลิก"
        ]
        .map(status => `

          <option
            value="${escAttr(status)}"
            ${
              status === order.orderStatus
                ? "selected"
                : ""
            }
          >
            ${status}
          </option>

        `)
        .join("")}

      </select>


      <div
        style="
          margin-top:15px;
        "
      >

        <button
          class="deleteBtn"
          data-id="${order.id}"
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


// =====================================================
// ป้องกัน HTML
// =====================================================

function esc(value) {

  return String(value)
    .replace(
      /[&<>"']/g,
      char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      }[char])
    );

}


function escAttr(value) {

  return esc(value);

}
