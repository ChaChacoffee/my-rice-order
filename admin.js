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


// ========================================
// Firebase
// ========================================

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

const auth = getAuth(app);

const provider = new GoogleAuthProvider();


// ========================================
// HTML
// ========================================

const loginBox =
  document.getElementById("loginBox");

const adminBox =
  document.getElementById("adminBox");

const loginMessage =
  document.getElementById("loginMessage");

const ordersEl =
  document.getElementById("orders");

const summary =
  document.getElementById("summary");

const userEmail =
  document.getElementById("userEmail");

const loginBtn =
  document.getElementById("loginBtn");

const logoutBtn =
  document.getElementById("logoutBtn");


// ========================================
// ตรวจสอบ Element
// ========================================

if (!loginBtn) {

  console.error(
    "ไม่พบปุ่ม loginBtn"
  );

}


// ========================================
// LOGIN
// ========================================

if (loginBtn) {

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
          "เข้าสู่ระบบไม่สำเร็จ";


        loginBtn.disabled = false;

      }

    }
  );

}


// ========================================
// LOGOUT
// ========================================

if (logoutBtn) {

  logoutBtn.addEventListener(
    "click",
    async () => {

      try {

        await signOut(auth);

      } catch (error) {

        console.error(
          "LOGOUT ERROR:",
          error
        );

      }

    }
  );

}


// ========================================
// ตรวจสอบ Admin
// ========================================

function isAdmin(email) {

  if (!email) {

    return false;

  }


  if (!Array.isArray(ADMIN_EMAILS)) {

    console.error(
      "ADMIN_EMAILS ไม่ใช่ Array"
    );

    return false;

  }


  const currentEmail =
    String(email)
      .trim()
      .toLowerCase();


  return ADMIN_EMAILS
    .map(
      email =>
        String(email)
          .trim()
          .toLowerCase()
    )
    .includes(currentEmail);

}


// ========================================
// ดึงรายการอาหาร
// ========================================

function getOrderItems(order) {

  if (
    Array.isArray(order.items) &&
    order.items.length > 0
  ) {

    return order.items;

  }


  return [

    {

      riceType:
        order.riceType || "",

      toppings:
        Array.isArray(order.toppings)
          ? order.toppings
          : [],

      packageType:
        order.packageType || "",

      quantity:
        Number(
          order.quantity || 0
        ),

      unitPrice:
        Number(
          order.total || 0
        ) /
        Math.max(
          Number(
            order.quantity || 1
          ),
          1
        ),

      lineTotal:
        Number(
          order.total || 0
        )

    }

  ];

}


// ========================================
// จำนวนรวม
// ========================================

function getOrderQuantity(order) {

  const items =
    getOrderItems(order);


  return items.reduce(
    (sum, item) => {

      return (
        sum +
        Number(
          item.quantity || 0
        )
      );

    },
    0
  );

}


// ========================================
// แสดงออเดอร์
// ========================================

function renderOrders(snapshot) {

  const rows =
    snapshot.docs.map(
      document => ({

        id: document.id,

        ...document.data()

      })
    );


  rows.sort(
    (a, b) => {

      return (
        (b.createdAt?.seconds || 0) -
        (a.createdAt?.seconds || 0)
      );

    }
  );


  const totalQty =
    rows.reduce(
      (sum, order) => {

        return (
          sum +
          getOrderQuantity(order)
        );

      },
      0
    );


  const totalMoney =
    rows.reduce(
      (sum, order) => {

        return (
          sum +
          Number(
            order.total || 0
          )
        );

      },
      0
    );


  summary.textContent =
    `ทั้งหมด ${rows.length} ออเดอร์ • ${totalQty} ชุด • ${totalMoney.toLocaleString()} บาท`;


  ordersEl.innerHTML =
    rows.length
      ? rows
          .map(
            order =>
              createOrderHTML(order)
          )
          .join("")
      : "<p>ยังไม่มีออเดอร์</p>";


  // ====================================
  // เปลี่ยนสถานะ
  // ====================================

  document
    .querySelectorAll(".status")
    .forEach(select => {

      select.onchange =
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

        };

    });


  // ====================================
  // แก้ไข
  // ====================================

  document
    .querySelectorAll(".editBtn")
    .forEach(button => {

      button.onclick = () => {

        const order =
          rows.find(
            item =>
              item.id ===
              button.dataset.id
          );


        if (order) {

          showEditForm(order);

        }

      };

    });


  // ====================================
  // ลบ
  // ====================================

  document
    .querySelectorAll(".deleteBtn")
    .forEach(button => {

      button.onclick =
        async () => {

          const ok =
            confirm(
              "ยืนยันการลบออเดอร์นี้ใช่ไหม?\n\nเมื่อลบแล้วจะไม่สามารถกู้คืนได้"
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


            alert(
              "ลบออเดอร์เรียบร้อยแล้ว"
            );


          } catch (error) {

            console.error(error);

            alert(
              "ลบออเดอร์ไม่สำเร็จ"
            );

          }

        };

    });

}


// ========================================
// สร้างออเดอร์
// ========================================

function createOrderHTML(order) {

  const items =
    getOrderItems(order);


  const itemsHTML =
    items
      .map(
        (item, index) => {

          const toppings =
            Array.isArray(
              item.toppings
            )
              ? item.toppings
              : [];


          const quantity =
            Number(
              item.quantity || 0
            );


          const lineTotal =
            Number(
              item.lineTotal ||
              (
                Number(
                  item.unitPrice || 0
                ) *
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

              <div
                style="
                  font-weight:bold;
                  font-size:18px;
                  margin-bottom:8px;
                "
              >
                🍚 รายการที่ ${index + 1}
              </div>


              <div class="line">
                🍚 ข้าว:
                ${esc(
                  item.riceType || "-"
                )}
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


              <div
                class="line"
                style="font-weight:bold;"
              >
                💰 รายการนี้:
                ${lineTotal.toLocaleString()}
                บาท
              </div>

            </div>

          `;

        }
      )
      .join("");


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


      <div
        class="line"
        style="margin-top:12px;"
      >
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


      ${
        order.note
          ? `
            <div class="line">
              📝 ${esc(order.note)}
            </div>
          `
          : ""
      }


      <div class="line">
        สถานะ:
      </div>


      <select
        data-id="${order.id}"
        class="status"
      >

        ${[
          "รอทำ",
          "กำลังทำ",
          "พร้อมส่ง",
          "ส่งแล้ว",
          "ยกเลิก"
        ]
          .map(
            status => `

              <option
                value="${escAttr(status)}"
                ${
                  status ===
                  order.orderStatus
                    ? "selected"
                    : ""
                }
              >
                ${status}
              </option>

            `
          )
          .join("")}

      </select>


      <div
        style="
          display:flex;
          gap:10px;
          margin-top:15px;
          flex-wrap:wrap;
        "
      >

        <button
          class="editBtn"
          data-id="${order.id}"
          type="button"
        >
          ✏️ แก้ไขออเดอร์
        </button>


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


// ========================================
// ฟอร์มแก้ไข
// ========================================

function showEditForm(order) {

  const oldForm =
    document.getElementById(
      "editOrderForm"
    );


  if (oldForm) {

    oldForm.remove();

  }


  const items =
    getOrderItems(order);


  const form =
    document.createElement("div");


  form.id =
    "editOrderForm";


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


  const itemsHTML =
    items
      .map(
        (item, index) => {

          const toppings =
            Array.isArray(
              item.toppings
            )
              ? item.toppings.join(", ")
              : "";


          return `

            <div
              class="editItem"
              data-index="${index}"
              style="
                border:1px solid #ddd;
                border-radius:12px;
                padding:15px;
                margin-bottom:15px;
                background:#f8f8f8;
              "
            >

              <h3>
                🍚 รายการที่ ${index + 1}
              </h3>


              <label>
                ข้าว
              </label>

              <input
                class="editRice"
                value="${escAttr(
                  item.riceType || ""
                )}"
                style="${inputStyle()}"
              >


              <label>
                หน้า
              </label>

              <input
                class="editToppings"
                value="${escAttr(
                  toppings
                )}"
                placeholder="เช่น หมูฝอย, หมูกรอบ"
                style="${inputStyle()}"
              >


              <label>
                แบบบรรจุ
              </label>

              <input
                class="editPackage"
                value="${escAttr(
                  item.packageType || ""
                )}"
                style="${inputStyle()}"
              >


              <label>
                จำนวน
              </label>

              <input
                class="editItemQuantity"
                type="number"
                min="1"
                value="${Number(
                  item.quantity || 1
                )}"
                style="${inputStyle()}"
              >


              <label>
                ราคา/ชุด
              </label>

              <input
                class="editUnitPrice"
                type="number"
                min="0"
                value="${Number(
                  item.unitPrice || 0
                )}"
                style="${inputStyle()}"
              >

            </div>

          `;

        }
      )
      .join("");


  form.innerHTML = `

    <div
      style="
        background:white;
        color:#111;
        width:100%;
        max-width:650px;
        max-height:90vh;
        overflow:auto;
        border-radius:16px;
        padding:20px;
        box-sizing:border-box;
      "
    >

      <h2>
        ✏️ แก้ไขออเดอร์
      </h2>


      <label>
        ชื่อลูกค้า
      </label>

      <input
        id="editCustomerName"
        value="${escAttr(
          order.customerName || ""
        )}"
        style="${inputStyle()}"
      >


      <h3>
        🛒 รายการอาหาร
      </h3>


      <div id="editItems">
        ${itemsHTML}
      </div>


      <label>
        เบอร์โทร
      </label>

      <input
        id="editPhone"
        value="${escAttr(
          order.phone || ""
        )}"
        style="${inputStyle()}"
      >


      <label>
        ที่อยู่
      </label>

      <textarea
        id="editAddress"
        style="${textareaStyle()}"
      >${esc(
        order.address || ""
      )}</textarea>


      <label>
        หมายเหตุ
      </label>

      <textarea
        id="editNote"
        style="${textareaStyle()}"
      >${esc(
        order.note || ""
      )}</textarea>


      <label>
        ยอดรวม
      </label>

      <input
        id="editTotal"
        type="number"
        min="0"
        value="${Number(
          order.total || 0
        )}"
        style="${inputStyle()}"
      >


      <label>
        สถานะ
      </label>

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
        ]
          .map(
            status => `

              <option
                value="${escAttr(status)}"
                ${
                  status ===
                  order.orderStatus
                    ? "selected"
                    : ""
                }
              >
                ${status}
              </option>

            `
          )
          .join("")}

      </select>


      <div
        style="
          display:flex;
          gap:10px;
          margin-top:20px;
        "
      >

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


  // ====================================
  // ยกเลิก
  // ====================================

  document.getElementById(
    "cancelEditBtn"
  ).onclick = () => {

    form.remove();

  };


  // ====================================
  // บันทึก
  // ====================================

  document.getElementById(
    "saveEditBtn"
  ).onclick = async () => {

    const saveBtn =
      document.getElementById(
        "saveEditBtn"
      );


    saveBtn.disabled = true;

    saveBtn.textContent =
      "กำลังบันทึก...";


    try {

      const editItems =
        [
          ...form.querySelectorAll(
            ".editItem"
          )
        ]
        .map(itemEl => {

          const toppingsText =
            itemEl
              .querySelector(
                ".editToppings"
              )
              .value;


          const toppings =
            toppingsText
              .split(",")
              .map(
                x => x.trim()
              )
              .filter(Boolean);


          const quantity =
            Number(
              itemEl
                .querySelector(
                  ".editItemQuantity"
                )
                .value
            );


          const unitPrice =
            Number(
              itemEl
                .querySelector(
                  ".editUnitPrice"
                )
                .value
            );


          return {

            riceType:
              itemEl
                .querySelector(
                  ".editRice"
                )
                .value
                .trim(),


            toppings,


            packageType:
              itemEl
                .querySelector(
                  ".editPackage"
                )
                .value
                .trim(),


            quantity,

            unitPrice,

            lineTotal:
              unitPrice *
              quantity

          };

        });


      const totalQuantity =
        editItems.reduce(
          (sum, item) =>
            sum +
            Number(
              item.quantity || 0
            ),
          0
        );


      const updateData = {

        customerName:
          document
            .getElementById(
              "editCustomerName"
            )
            .value
            .trim(),


        items:
          editItems,


        riceType:
          editItems[0]?.riceType ||
          "",


        toppings:
          editItems[0]?.toppings ||
          [],


        packageType:
          editItems[0]?.packageType ||
          "",


        quantity:
          totalQuantity,


        total:
          Number(
            document
              .getElementById(
                "editTotal"
              )
              .value
          ),


        phone:
          document
            .getElementById(
              "editPhone"
            )
            .value
            .trim(),


        address:
          document
            .getElementById(
              "editAddress"
            )
            .value
            .trim(),


        note:
          document
            .getElementById(
              "editNote"
            )
            .value
            .trim(),


        orderStatus:
          document
            .getElementById(
              "editStatus"
            )
            .value

      };


      await updateDoc(
        doc(
          db,
          "orders",
          order.id
        ),
        updateData
      );


      form.remove();


      alert(
        "แก้ไขออเดอร์เรียบร้อยแล้ว"
      );


    } catch (error) {

      console.error(error);


      alert(
        "แก้ไขไม่สำเร็จ\n\n" +
        "กรุณาตรวจสอบ Firestore Rules"
      );


      saveBtn.disabled = false;

      saveBtn.textContent =
        "💾 บันทึก";

    }

  };

}


// ========================================
// Style ช่องกรอก
// ========================================

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


// ========================================
// ป้องกัน HTML
// ========================================

function esc(value) {

  return String(value).replace(
    /[&<>"']/g,
    character => ({

      "&": "&amp;",

      "<": "&lt;",

      ">": "&gt;",

      '"': "&quot;",

      "'": "&#039;"

    }[character])
  );

}


function escAttr(value) {

  return esc(value);

}


// ========================================
// AUTH
// ========================================

let unsubscribe = null;


onAuthStateChanged(
  auth,
  async user => {

    // หยุด listener เก่า
    if (unsubscribe) {

      unsubscribe();

      unsubscribe = null;

    }


    // ====================================
    // ยังไม่ได้ Login
    // ====================================

    if (!user) {

      loginBox.classList.remove(
        "hidden"
      );

      adminBox.classList.add(
        "hidden"
      );

      if (loginBtn) {

        loginBtn.disabled = false;

      }

      loginMessage.textContent = "";

      return;

    }


    // ====================================
    // ตรวจสอบผู้ดูแล
    // ====================================

    if (!isAdmin(user.email)) {

      loginBox.classList.remove(
        "hidden"
      );

      adminBox.classList.add(
        "hidden"
      );


      loginMessage.textContent =
        "บัญชีนี้ไม่มีสิทธิ์เป็นผู้ดูแล";


      await signOut(auth);

      return;

    }


    // ====================================
    // เป็นผู้ดูแล
    // ====================================

    loginBox.classList.add(
      "hidden"
    );

    adminBox.classList.remove(
      "hidden"
    );


    userEmail.textContent =
      user.email;


    // ====================================
    // โหลดออเดอร์
    // ====================================

    const ordersQuery =
      query(
        collection(
          db,
          "orders"
        ),
        orderBy(
          "createdAt",
          "desc"
        )
      );


    unsubscribe =
      onSnapshot(
        ordersQuery,
        renderOrders,
        error => {

          console.error(
            "FIRESTORE ERROR:",
            error
          );


          ordersEl.innerHTML =
            `
              <p>
                อ่านออเดอร์ไม่ได้
                กรุณาตรวจสอบ Firestore Rules
              </p>
            `;

        }
      );

  }
);
