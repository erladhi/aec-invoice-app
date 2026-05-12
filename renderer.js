const { jsPDF } = window.jspdf;

let items = [];

const clientNameEl = document.getElementById('clientName');
const productNameEl = document.getElementById('productName');
const qtyEl = document.getElementById('qty');
const unitPriceEl = document.getElementById('unitPrice');
const discountEl = document.getElementById('discount');
const taxEl = document.getElementById('tax');

const itemsTableBody = document.querySelector('#itemsTable tbody');
const totalsDiv = document.getElementById('totals');
const historyTableBody = document.querySelector('#historyTable tbody');

function renderItems() {
  itemsTableBody.innerHTML = '';
  items.forEach((item, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.name}</td>
      <td>${item.qty}</td>
      <td>${item.price.toFixed(2)}</td>
      <td>${(item.qty * item.price).toFixed(2)}</td>
      <td><button data-index="${index}" class="removeItem">Remove</button></td>
    `;
    itemsTableBody.appendChild(tr);
  });

  document.querySelectorAll('.removeItem').forEach(button => {
    button.onclick = () => {
      const idx = button.getAttribute('data-index');
      items.splice(idx, 1);
      renderItems();
      calculateTotals();
    };
  });
}

function calculateTotals() {
  const discountPercent = parseFloat(discountEl.value) || 0;
  const taxPercent = parseFloat(taxEl.value) || 0;

  let subtotal = 0;
  items.forEach(item => {
    subtotal += item.qty * item.price;
  });

  const discountAmount = subtotal * (discountPercent / 100);
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = afterDiscount * (taxPercent / 100);
  const total = afterDiscount + taxAmount;

  totalsDiv.innerHTML = `
    Subtotal: ${subtotal.toFixed(2)}<br>
    Discount (${discountPercent}%): -${discountAmount.toFixed(2)}<br>
    Tax (${taxPercent}%): +${taxAmount.toFixed(2)}<br>
    <b>Total: ${total.toFixed(2)}</b>
  `;

  return { subtotal, discountAmount, taxAmount, total };
}

document.getElementById('addItem').addEventListener('click', () => {
  const name = productNameEl.value.trim();
  const qty = parseInt(qtyEl.value);
  const price = parseFloat(unitPriceEl.value);

  if (!name) return alert("Product name cannot be empty");
  if (qty <= 0) return alert("Quantity must be greater than zero");
  if (price < 0) return alert("Unit price must be zero or more");

  items.push({ name, qty, price });
  renderItems();
  calculateTotals();

  productNameEl.value = '';
  qtyEl.value = 1;
  unitPriceEl.value = 0;
});

document.getElementById('generatePDF').addEventListener('click', () => {
  if (!clientNameEl.value.trim()) return alert("Please enter client name");
  if (items.length === 0) return alert("Add at least one item");

  const { subtotal, discountAmount, taxAmount, total } = calculateTotals();

  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("AEC Consultancy Invoice", 20, 20);
  doc.setFontSize(12);
  doc.text(`Client: ${clientNameEl.value}`, 20, 30);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, 30);

  doc.text("Product", 20, 50);
  doc.text("Qty", 100, 50);
  doc.text("Unit Price", 130, 50);
  doc.text("Subtotal", 170, 50);

  let y = 60;
  items.forEach(item => {
    doc.text(item.name, 20, y);
    doc.text(item.qty.toString(), 100, y);
    doc.text(item.price.toFixed(2), 130, y);
    doc.text((item.qty * item.price).toFixed(2), 170, y);
    y += 10;
  });

  y += 10;
  doc.text(`Subtotal: ${subtotal.toFixed(2)}`, 150, y);
  doc.text(`Discount: -${discountAmount.toFixed(2)}`, 150, y + 10);
  doc.text(`Tax: +${taxAmount.toFixed(2)}`, 150, y + 20);
  doc.text(`Total: ${total.toFixed(2)}`, 150, y + 30);

  doc.save(`Invoice_${clientNameEl.value.replace(/\s+/g, '_')}_${Date.now()}.pdf`);

  window.electronAPI.saveInvoice({
    clientName: clientNameEl.value,
    date: new Date().toISOString(),
    items,
    discount: discountEl.value,
    tax: taxEl.value,
    total
  }).then(() => {
    alert('Invoice saved to history.');
    loadHistory();
  });
});

document.getElementById('copyInvoice').addEventListener('click', () => {
  if (!clientNameEl.value.trim()) return alert("Please enter client name");
  if (items.length === 0) return alert("Add at least one item");

  const { subtotal, discountAmount, taxAmount, total } = calculateTotals();

  let text = `Invoice for ${clientNameEl.value}\nDate: ${new Date().toLocaleDateString()}\n\nItems:\n`;
  items.forEach(i => {
    text += `${i.name} x${i.qty} @${i.price.toFixed(2)} = ${(i.qty * i.price).toFixed(2)}\n`;
  });
  text += `\nSubtotal: ${subtotal.toFixed(2)}\nDiscount: -${discountAmount.toFixed(2)}\nTax: +${taxAmount.toFixed(2)}\nTotal: ${total.toFixed(2)}`;

  window.electronAPI.writeClipboard(text);
  alert('Invoice text copied to clipboard');
});

function loadHistory() {
  window.electronAPI.getInvoices().then(invoices => {
    historyTableBody.innerHTML = '';
    invoices.forEach(inv => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${inv.id}</td>
        <td>${inv.clientName}</td>
        <td>${new Date(inv.date).toLocaleDateString()}</td>
        <td>${inv.total.toFixed(2)}</td>
      `;
      historyTableBody.appendChild(tr);
    });
  });
}

loadHistory();
