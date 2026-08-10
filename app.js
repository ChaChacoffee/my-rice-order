import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import { firebaseConfig } from "./firebase-config.js";


// ========================================
// Firebase
// ========================================

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);


// ========================================
// ตั้งราคาต่อชุด
// ========================================

const PRICE_PER_SET = 20;


// ========================================
// ตัวเลือก
// ========================================

const RICE_OPTIONS = [
  "ข้าวเหนียวขาว",
  "ข้าวเหนียวดำ"
];


const TOPPING_OPTIONS = [
  "หมูฝอย",
  "หมูกรอบ"
];


const PACKAGE_OPTIONS = [
  "ปกติ 1 อย่าง"
];


// ========================================
// Elements
// ========================================

const itemsEl =
  document.getElementById("items");

const addItemBtn =
  document.getElementById("addItemBtn");

const orderSummary =
  document.getElementById("orderSummary");

const submitBtn =
  document.getElementById("submitBtn");

const messageEl =
  document.getElementById("message");


// ========================================
// รายการสินค้า
// ========================================

let items = [];


// ========================================
// สร้างรายการใหม่
// ========================================

function createItem() {

  return {

    riceType: "ข้าวเหนียวขาว",

    topping: "หมูฝอย",

    packageType: "ปกติ 1 อย่าง",

    quantity: 1

  };

}


// ========================================
// เพิ่มรายการ
// ========================================

function addItem() {

  items.push(createItem());

  renderItems();

}


// ========================================
// ลบรายการ
// ========================================

function removeItem(index) {

  if (items.length <= 1) {

    alert("ต้องมีอย่างน้อย 1 รายการ");

    return;

  }


  items.splice(index, 1);

  renderItems();

}


// ========================================
// แสดงรายการ
// ========================================

function renderItems() {

  itemsEl.innerHTML = "";


  items.forEach((item, index) => {

    const box =
      document.createElement("div");


    box.style.cssText = `
      border:1px solid #ddd;
      border-radius:12px;
      padding:15px;
      margin-top:15px;
      background:#fff;
    `;


    box.innerHTML = `

      <div style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        margin-bottom:12px;
      ">

        <strong style="font-size:18px">
          รายการที่ ${index + 1}
        </strong>

        ${
          items.length > 1
            ? `
              <button
                type="button"
                class="removeItemBtn"
                data-index="${index}"
                style="
                  background:#d32f2f;
                  color:white;
                  border:0;
                  border-radius:8px;
                  padding:8px 12px;
                "
              >
                🗑️ ลบ
              </button>
            `
            : ""
        }

      </div>


      <label>
        🍚 ข้าว
      </label>

      <select
        class="riceSelect"
        data-index="${index}"
        style="${inputStyle()}"
      >

        ${RICE_OPTIONS.map(rice => `
          <option
            value="${escapeAttr(rice)}"
            ${
              rice === item.riceType
                ? "selected"
                : ""
            }
          >
            ${escapeHtml(rice)}
          </option>
        `).join("")}

      </select>


      <label>
        🥩 หน้า
      </label>

      <select
        class="toppingSelect"
        data-index="${index}"
        style="${inputStyle()}"
      >

        ${TOPPING_OPTIONS.map(topping => `
          <option
            value="${escapeAttr(topping)}"
            ${
              topping === item.topping
                ? "selected"
                : ""
            }
          >
            ${escapeHtml(topping)}
          </option>
        `).join("")}

      </select>


      <label>
        📦 แบบ
      </label>

      <select
        class="packageSelect"
        data-index="${index}"
        style="${inputStyle()}"
      >

        ${PACKAGE_OPTIONS.map(packageType => `
          <option
            value="${escapeAttr(packageType)}"
            ${
              packageType === item.packageType
                ? "selected"
                : ""
            }
          >
            ${escapeHtml(packageType)}
          </option>
        `).join("")}

      </select>


      <label>
        🔢 จำนวน
      </label>

      <input
        class="quantityInput"
        data-index="${index}"
        type="number"
        min="1"
        value="${item.quantity}"
        style="${inputStyle()}"
      >


      <div style="
        margin-top:10px;
        font-weight:bold;
        font-size:17px;
      ">
        ${PRICE_PER_SET.toLocaleString()} บาท/ชุด
      </div>

    `;


    itemsEl.appendChild(box);

  });


  attachItemEvents();

  updateSummary();

}


// ========================================
// Event ของแต่ละรายการ
// ========================================

function attachItemEvents() {


  document
    .querySelectorAll(".removeItemBtn")
    .forEach(button => {

      button.onclick = () => {

        const index =
          Number(button.dataset.index);

        removeItem(index);

      };

    });


  document
    .querySelectorAll(".riceSelect")
    .forEach(select => {

      select.onchange = () => {

        const index =
          Number(select.dataset.index);

        items[index].riceType =
          select.value;

      };

    });


  document
    .querySelectorAll(".toppingSelect")
    .forEach(select => {

      select.onchange = () => {

        const index =
          Number(select.dataset.index);

        items[index].topping =
          select.value;

      };

    });


  document
    .querySelectorAll(".packageSelect")
    .forEach(select => {

      select.onchange = () => {

        const index =
          Number(select.dataset.index);

        items[index].packageType =
          select.value;

      };

    });


  document
    .querySelectorAll(".quantityInput")
    .forEach(input => {

      input.oninput = () => {

        const index =
          Number(input.dataset.index);


        let quantity =
          Number(input.value);


        if (!Number.isFinite(quantity) ||
            quantity < 1) {

          quantity = 1;

        }


        quantity =
          Math.floor(quantity);


        items[index].quantity =
          quantity;


        updateSummary();

      };

    });

}


// ========================================
// สรุปยอด
// ========================================

function updateSummary() {

  const totalQty =
    items.reduce(
      (sum, item) =>
        sum + Number(item.quantity || 0),
      0
    );


  const total =
    totalQty * PRICE_PER_SET;


  orderSummary.textContent =
    `รวม ${totalQty} ชุด • ${total.toLocaleString()} บาท`;

}


// ========================================
// กดเพิ่มรายการ
// ========================================

addItemBtn.onclick = () => {

  addItem();

};


// ========================================
// ส่งออเดอร์
// ========================================

submitBtn.onclick = async () => {

  messageEl.textContent = "";


  // ------------------------------------
  // ตรวจข้อมูลรายการ
  // ------------------------------------

  if (!items.length) {

    alert("กรุณาเพิ่มรายการอาหาร");

    return;

  }


  for (const item of items) {

    if (!item.quantity ||
        item.quantity < 1) {

      alert("จำนวนสินค้าต้องมากกว่า 0");

      return;

    }

  }


  // ------------------------------------
  // ข้อมูลลูกค้า
  // ------------------------------------

  const customerName =
    document
      .getElementById("customerName")
      .value
      .trim();


  const phone =
    document
      .getElementById("phone")
      .value
      .trim();


  const address =
    document
      .getElementById("address")
      .value
      .trim();


  const note =
    document
      .getElementById("note")
      .value
      .trim();


  if (!customerName) {

    alert("กรุณากรอกชื่อลูกค้า");

    return;

  }


  if (!phone) {

    alert("กรุณากรอกเบอร์โทร");

    return;

  }


  if (!address) {

    alert("กรุณากรอกที่อยู่");

    return;

  }


  // ------------------------------------
  // เตรียมรายการ
  // ------------------------------------

  const orderItems =
    items.map(item => {

      const quantity =
        Number(item.quantity);


      return {

        riceType:
          item.riceType,

        topping:
          item.topping,

        packageType:
          item.packageType,

        quantity:
          quantity,

        unitPrice:
          PRICE_PER_SET,

        total:
          quantity * PRICE_PER_SET

      };

    });


  // ------------------------------------
  // จำนวนรวม
  // ------------------------------------

  const totalQuantity =
    orderItems.reduce(
      (sum, item) =>
        sum + item.quantity,
      0
    );


  // ------------------------------------
  // เงินรวม
  // ------------------------------------

  const totalMoney =
    orderItems.reduce(
      (sum, item) =>
        sum + item.total,
      0
    );


  // ------------------------------------
  // ป้องกันกดซ้ำ
  // ------------------------------------

  submitBtn.disabled = true;

  submitBtn.textContent =
    "กำลังส่งออเดอร์...";


  try {

    // ----------------------------------
    // บันทึก Firestore
    // ----------------------------------

    await addDoc(
      collection(db, "orders"),
      {

        // ข้อมูลลูกค้า
        customerName:
          customerName,

        phone:
          phone,

        address:
          address,

        note:
          note,


        // รายการทั้งหมด
        items:
          orderItems,


        // จำนวนรวม
        quantity:
          totalQuantity,


        // ยอดรวม
        total:
          totalMoney,


        // สถานะ
        orderStatus:
          "รอทำ",


        // เวลา
        createdAt:
          serverTimestamp(),


        // --------------------------------
        // ข้อมูลชุดแรก
        // --------------------------------
        // เก็บไว้เพื่อให้ admin.js
        // รุ่นปัจจุบันยังอ่านได้

        riceType:
          orderItems[0].riceType,

        toppings:
          [orderItems[0].topping],

        packageType:
          orderItems[0].packageType

      }
    );


    // ----------------------------------
    // สำเร็จ
    // ----------------------------------

    messageEl.textContent =
      "✅ สั่งซื้อเรียบร้อยแล้ว";


    messageEl.style.color =
      "green";


    alert(
      `สั่งซื้อเรียบร้อยแล้ว\n\n` +
      `ทั้งหมด ${totalQuantity} ชุด\n` +
      `รวม ${totalMoney.toLocaleString()} บาท`
    );


    // ----------------------------------
    // ล้างฟอร์ม
    // ----------------------------------

    document
      .getElementById("customerName")
      .value = "";


    document
      .getElementById("phone")
      .value = "";


    document
      .getElementById("address")
      .value = "";


    document
      .getElementById("note")
      .value = "";


    items = [
      createItem()
    ];


    renderItems();


  } catch (error) {

    console.error(error);


    messageEl.textContent =
      "❌ ส่งออเดอร์ไม่สำเร็จ";


    messageEl.style.color =
      "red";


    alert(
      "ส่งออเดอร์ไม่สำเร็จ\n\n" +
      "กรุณาลองใหม่อีกครั้ง"
    );

  } finally {

    submitBtn.disabled = false;

    submitBtn.textContent =
      "✅ ยืนยันสั่งซื้อ";

  }

};


// ========================================
// CSS ช่องกรอก
// ========================================

function inputStyle() {

  return `
    width:100%;
    box-sizing:border-box;
    padding:11px;
    margin:6px 0 15px;
    border:1px solid #ccc;
    border-radius:8px;
    font-size:16px;
    background:white;
  `;

}


// ========================================
// ป้องกัน HTML
// ========================================

function escapeHtml(value) {

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


function escapeAttr(value) {

  return escapeHtml(value);

}


// ========================================
// เริ่มต้น
// ========================================

items = [
  createItem()
];


renderItems();
