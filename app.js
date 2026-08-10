import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
  firebaseConfig
} from "./firebase-config.js";


const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


const form = document.getElementById("orderForm");
const itemsEl = document.getElementById("items");
const addItemBtn = document.getElementById("addItemBtn");
const totalEl = document.getElementById("total");
const messageEl = document.getElementById("message");
const submitBtn = document.getElementById("submitBtn");


const toppingList = [
  "หมูฝอย",
  "หมูกรอบ",
  "หมูสวรรค์",
  "ลาบหมู",
  "หมูเค็ม",
  "เนื้อเค็ม"
];


let itemNumber = 0;


// =========================
// เพิ่มรายการ
// =========================

function addItem() {

  itemNumber++;

  const item = document.createElement("div");

  item.className = "order-item";

  item.style.cssText = `
    border:1px solid #ddd;
    border-radius:14px;
    padding:15px;
    margin-bottom:15px;
    background:#fafafa;
  `;


  item.innerHTML = `

    <div style="
      display:flex;
      justify-content:space-between;
      align-items:center;
      margin-bottom:10px;
    ">

      <h3 style="margin:0">
        🍚 รายการที่ ${itemNumber}
      </h3>

      <button
        type="button"
        class="removeItem"
        style="
          background:#dc3545;
          color:white;
          padding:6px 10px;
        "
      >
        ลบ
      </button>

    </div>


    <strong>เลือกข้าว</strong>

    <label>
      <input
        type="radio"
        name="rice-${itemNumber}"
        value="ข้าวเหนียวขาว"
        required
      >
      🍚 ข้าวเหนียวขาว
    </label>

    <label>
      <input
        type="radio"
        name="rice-${itemNumber}"
        value="ข้าวเหนียวดำ"
      >
      🍚 ข้าวเหนียวดำ
    </label>


    <label>
      <strong>รูปแบบ</strong>

      <select
        class="packageType"
        required
      >

        <option value="">
          -- เลือก --
        </option>

        <option
          value="ปกติ 1 อย่าง"
          data-price="20"
        >
          1 อย่าง — 20 บาท
        </option>

        <option
          value="ปกติ 2 อย่าง"
          data-price="30"
        >
          2 อย่าง — 30 บาท
        </option>

        <option
          value="กล่องเล็ก"
          data-price="35"
        >
          กล่องเล็ก — 35 บาท
        </option>

        <option
          value="กล่องใหญ่"
          data-price="50"
        >
          กล่องใหญ่ — 50 บาท
        </option>

      </select>

    </label>


    <strong>เลือกหน้า</strong>

    <div class="toppings">

      ${toppingList.map(t => `
        <label>
          <input
            type="checkbox"
            class="topping"
            value="${t}"
          >
          ${t}
        </label>
      `).join("")}

    </div>


    <label>
      <strong>จำนวน</strong>

      <input
        type="number"
        class="quantity"
        min="1"
        value="1"
        required
      >

    </label>


    <div style="
      text-align:right;
      font-weight:bold;
      margin-top:10px;
    ">

      รายการนี้:
      <span class="lineTotal">0</span>
      บาท

    </div>

  `;


  itemsEl.appendChild(item);


  // เปลี่ยนราคา / จำนวน / หน้า
  item.querySelector(".packageType")
    .addEventListener("change", () => {

      validateToppings(item);
      calculateTotal();

    });


  item.querySelector(".quantity")
    .addEventListener("input", calculateTotal);


  item.querySelectorAll(".topping")
    .forEach(cb => {

      cb.addEventListener("change", () => {

        validateToppings(item);
        calculateTotal();

      });

    });


  // ลบรายการ
  item.querySelector(".removeItem")
    .addEventListener("click", () => {

      item.remove();

      renumberItems();
      calculateTotal();

    });


  calculateTotal();
}


// =========================
// จำกัดจำนวนหน้า
// =========================

function validateToppings(item) {

  const packageType =
    item.querySelector(".packageType").value;

  const toppings =
    [...item.querySelectorAll(".topping:checked")];


  let max = 99;

  if (packageType === "ปกติ 1 อย่าง") {
    max = 1;
  }

  if (packageType === "ปกติ 2 อย่าง") {
    max = 2;
  }


  if (toppings.length > max) {

    const last =
      toppings[toppings.length - 1];

    last.checked = false;

    alert(
      packageType === "ปกติ 1 อย่าง"
        ? "แบบ 1 อย่าง เลือกหน้าได้ 1 อย่างครับ"
        : "แบบ 2 อย่าง เลือกหน้าได้ 2 อย่างครับ"
    );

  }

}


// =========================
// คำนวณยอดรวม
// =========================

function calculateTotal() {

  let total = 0;


  document
    .querySelectorAll(".order-item")
    .forEach(item => {

      const select =
        item.querySelector(".packageType");

      const quantity =
        Number(
          item.querySelector(".quantity").value || 0
        );


      const option =
        select.options[select.selectedIndex];


      const price =
        Number(
          option?.dataset?.price || 0
        );


      const lineTotal =
        price * quantity;


      item.querySelector(".lineTotal")
        .textContent =
          lineTotal.toLocaleString();


      total += lineTotal;

    });


  totalEl.textContent =
    total.toLocaleString();


  return total;
}


// =========================
// เรียงเลขรายการใหม่
// =========================

function renumberItems() {

  document
    .querySelectorAll(".order-item")
    .forEach((item, index) => {

      const h3 =
        item.querySelector("h3");

      h3.textContent =
        `🍚 รายการที่ ${index + 1}`;

    });


  itemNumber =
    document.querySelectorAll(".order-item").length;

}


// =========================
// เก็บข้อมูลแต่ละรายการ
// =========================

function getItems() {

  const items = [];


  document
    .querySelectorAll(".order-item")
    .forEach(item => {

      const rice =
        item.querySelector(
          'input[type="radio"]:checked'
        );


      const packageType =
        item.querySelector(".packageType");


      const quantity =
        Number(
          item.querySelector(".quantity").value
        );


      const toppings =
        [...item.querySelectorAll(".topping:checked")]
          .map(cb => cb.value);


      const option =
        packageType.options[
          packageType.selectedIndex
        ];


      const unitPrice =
        Number(
          option?.dataset?.price || 0
        );


      items.push({

        riceType:
          rice?.value || "",

        packageType:
          packageType.value,

        toppings,

        quantity,

        unitPrice,

        lineTotal:
          unitPrice * quantity

      });

    });


  return items;
}


// =========================
// เริ่มต้น 1 รายการ
// =========================

addItem();


// =========================
// ปุ่มเพิ่มรายการ
// =========================

addItemBtn.onclick = () => {

  addItem();

  window.scrollTo({
    top: document.body.scrollHeight,
    behavior: "smooth"
  });

};


// =========================
// ส่งออเดอร์
// =========================

form.addEventListener("submit", async e => {

  e.preventDefault();


  messageEl.textContent = "";


  const items =
    getItems();


  if (!items.length) {

    alert("กรุณาเพิ่มรายการอาหาร");

    return;

  }


  // ตรวจสอบรายการ
  for (const item of items) {

    if (!item.riceType) {

      alert("กรุณาเลือกชนิดข้าวทุกเมนู");

      return;

    }


    if (!item.packageType) {

      alert("กรุณาเลือกรูปแบบทุกเมนู");

      return;

    }


    if (!item.toppings.length) {

      alert("กรุณาเลือกหน้าทุกเมนู");

      return;

    }

  }


  const total =
    items.reduce(
      (sum, item) =>
        sum + item.lineTotal,
      0
    );


  const totalQuantity =
    items.reduce(
      (sum, item) =>
        sum + item.quantity,
      0
    );


  const customerName =
    document.getElementById("customerName")
      .value.trim();


  const phone =
    document.getElementById("phone")
      .value.trim();


  const address =
    document.getElementById("address")
      .value.trim();


  const note =
    document.getElementById("note")
      .value.trim();


  submitBtn.disabled = true;
  submitBtn.textContent =
    "กำลังส่งออเดอร์...";


  try {

    /*
      เก็บ items แบบใหม่
      และยังเก็บข้อมูลรายการแรกไว้ด้วย
      เพื่อให้ระบบเก่าที่มีอยู่ยังอ่านได้
    */

    const first = items[0];


    await addDoc(
      collection(db, "orders"),
      {

        customerName,

        phone,

        address,

        note,

        items,

        total,

        quantity: totalQuantity,

        riceType: first.riceType,

        toppings: first.toppings,

        packageType: first.packageType,

        orderStatus: "รอทำ",

        createdAt:
          serverTimestamp()

      }
    );


    messageEl.textContent =
      "✅ รับออเดอร์เรียบร้อยแล้วครับ";


    form.reset();


    itemsEl.innerHTML = "";

    itemNumber = 0;

    addItem();

    calculateTotal();


  } catch (error) {

    console.error(error);

    messageEl.textContent =
      "❌ ส่งออเดอร์ไม่สำเร็จ กรุณาลองใหม่";


  } finally {

    submitBtn.disabled = false;

    submitBtn.textContent =
      "✅ ยืนยันออเดอร์";

  }

});
