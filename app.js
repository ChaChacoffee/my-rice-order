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


// =========================
// HTML elements
// =========================

const form = document.getElementById("orderForm");
const itemsEl = document.getElementById("items");
const addItemBtn = document.getElementById("addItemBtn");
const totalEl = document.getElementById("total");
const messageEl = document.getElementById("message");
const submitBtn = document.getElementById("submitBtn");


// =========================
// หน้าทั้งหมด
// =========================

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
      gap:10px;
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
          padding:8px 12px;
          border:0;
          border-radius:8px;
        "
      >
        🗑️ ลบ
      </button>

    </div>


    <!-- ========================= -->
    <!-- เลือกข้าว -->
    <!-- ========================= -->

    <strong>🍚 เลือกข้าว</strong>

    <div style="margin:10px 0">

      <label style="display:block;margin-bottom:8px">

        <input
          type="radio"
          name="rice-${itemNumber}"
          value="ข้าวเหนียวขาว"
          required
        >

        ข้าวเหนียวขาว

      </label>


      <label style="display:block">

        <input
          type="radio"
          name="rice-${itemNumber}"
          value="ข้าวเหนียวดำ"
        >

        ข้าวเหนียวดำ

      </label>

    </div>


    <!-- ========================= -->
    <!-- เลือกหน้า -->
    <!-- ========================= -->

    <strong>🥩 เลือกหน้า</strong>

    <div
      class="toppings"
      style="
        display:grid;
        grid-template-columns:repeat(2,1fr);
        gap:8px;
        margin:10px 0 15px;
      "
    >

      ${toppingList.map(t => `
        <label
          style="
            border:1px solid #ddd;
            border-radius:8px;
            padding:8px;
          "
        >

          <input
            type="checkbox"
            class="topping"
            value="${t}"
          >

          ${t}

        </label>
      `).join("")}

    </div>


    <!-- ========================= -->
    <!-- รูปแบบ -->
    <!-- ========================= -->

    <label>

      <strong>📦 แบบ</strong>

      <select
        class="packageType"
        required
        style="
          width:100%;
          margin-top:8px;
          margin-bottom:15px;
        "
      >

        <option value="">
          -- เลือกแบบ --
        </option>

        <option
          value="ปกติ 1 อย่าง"
          data-price="20"
        >
          ปกติ 1 อย่าง — 20 บาท
        </option>

        <option
          value="ปกติ 2 อย่าง"
          data-price="30"
        >
          ปกติ 2 อย่าง — 30 บาท
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


    <!-- ========================= -->
    <!-- จำนวน -->
    <!-- ========================= -->

    <label>

      <strong>🔢 จำนวน</strong>

      <input
        type="number"
        class="quantity"
        min="1"
        value="1"
        required
        style="
          width:100%;
          margin-top:8px;
          margin-bottom:10px;
        "
      >

    </label>


    <!-- ========================= -->
    <!-- ราคารายการ -->
    <!-- ========================= -->

    <div style="
      text-align:right;
      font-weight:bold;
      margin-top:10px;
      font-size:18px;
    ">

      รายการนี้:
      <span class="lineTotal">0</span>
      บาท

    </div>

  `;


  itemsEl.appendChild(item);


  // =========================
  // เปลี่ยนแบบ
  // =========================

  item
    .querySelector(".packageType")
    .addEventListener("change", () => {

      validateToppings(item);
      calculateTotal();

    });


  // =========================
  // เปลี่ยนจำนวน
  // =========================

  item
    .querySelector(".quantity")
    .addEventListener(
      "input",
      calculateTotal
    );


  // =========================
  // เปลี่ยนหน้า
  // =========================

  item
    .querySelectorAll(".topping")
    .forEach(cb => {

      cb.addEventListener("change", () => {

        validateToppings(item);
        calculateTotal();

      });

    });


  // =========================
  // ปุ่มลบ
  // =========================

  item
    .querySelector(".removeItem")
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
    [
      ...item.querySelectorAll(
        ".topping:checked"
      )
    ];


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


    if (
      packageType === "ปกติ 1 อย่าง"
    ) {

      alert(
        "แบบ 1 อย่าง เลือกหน้าได้ 1 อย่างครับ"
      );

    } else {

      alert(
        "แบบ 2 อย่าง เลือกหน้าได้ 2 อย่างครับ"
      );

    }

  }

}


// =========================
// คำนวณราคา
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
          item.querySelector(
            ".quantity"
          ).value || 0
        );


      const option =
        select.options[
          select.selectedIndex
        ];


      const price =
        Number(
          option?.dataset?.price || 0
        );


      const lineTotal =
        price * quantity;


      const lineTotalEl =
        item.querySelector(
          ".lineTotal"
        );


      lineTotalEl.textContent =
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

  const items =
    document.querySelectorAll(
      ".order-item"
    );


  items.forEach((item, index) => {

    const h3 =
      item.querySelector("h3");


    h3.textContent =
      `🍚 รายการที่ ${index + 1}`;

  });


  itemNumber =
    items.length;

}


// =========================
// เก็บข้อมูลทุกเมนู
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
        item.querySelector(
          ".packageType"
        );


      const quantity =
        Number(
          item.querySelector(
            ".quantity"
          ).value || 0
        );


      const toppings =
        [
          ...item.querySelectorAll(
            ".topping:checked"
          )
        ].map(
          cb => cb.value
        );


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
// เริ่มต้นรายการแรก
// =========================

addItem();


// =========================
// ปุ่มเพิ่มรายการ
// =========================

addItemBtn.onclick = () => {

  addItem();


  window.scrollTo({

    top:
      document.body.scrollHeight,

    behavior:
      "smooth"

  });

};


// =========================
// ส่งออเดอร์
// =========================

form.addEventListener(
  "submit",
  async e => {

    e.preventDefault();


    messageEl.textContent = "";


    const items =
      getItems();


    if (!items.length) {

      alert(
        "กรุณาเพิ่มรายการอาหาร"
      );

      return;

    }


    // =========================
    // ตรวจสอบทุกเมนู
    // =========================

    for (
      const item of items
    ) {


      if (!item.riceType) {

        alert(
          "กรุณาเลือกชนิดข้าวทุกเมนู"
        );

        return;

      }


      if (!item.packageType) {

        alert(
          "กรุณาเลือกรูปแบบทุกเมนู"
        );

        return;

      }


      if (!item.toppings.length) {

        alert(
          "กรุณาเลือกหน้าทุกเมนู"
        );

        return;

      }

    }


    // =========================
    // ยอดรวม
    // =========================

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


    // =========================
    // ข้อมูลลูกค้า
    // =========================

    const customerName =
      document
        .getElementById(
          "customerName"
        )
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


    submitBtn.disabled = true;

    submitBtn.textContent =
      "กำลังส่งออเดอร์...";


    try {

      // รายการแรก
      // เก็บไว้ด้วยเพื่อให้ระบบเดิมยังอ่านได้

      const first =
        items[0];


      await addDoc(
        collection(
          db,
          "orders"
        ),
        {

          customerName,

          phone,

          address,

          note,

          // รายการทั้งหมด
          items,

          // ยอดรวมทั้งหมด
          total,

          // จำนวนทั้งหมด
          quantity:
            totalQuantity,

          // ข้อมูลรายการแรก
          riceType:
            first.riceType,

          toppings:
            first.toppings,

          packageType:
            first.packageType,

          // สถานะ
          orderStatus:
            "รอทำ",

          // เวลา
          createdAt:
            serverTimestamp()

        }
      );


      messageEl.textContent =
        "✅ รับออเดอร์เรียบร้อยแล้วครับ";


      // ล้างฟอร์ม
      form.reset();


      // ล้างรายการเดิม
      itemsEl.innerHTML = "";


      itemNumber = 0;


      // สร้างรายการใหม่ 1 รายการ
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

  }
);
