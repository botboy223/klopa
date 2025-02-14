function domReady(fn) {
    if (document.readyState === "complete" || document.readyState === "interactive") {
        setTimeout(fn, 1);
    } else {
        document.addEventListener("DOMContentLoaded", fn);
    }
}

function saveToLocalStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function loadFromLocalStorage(key) {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
}

domReady(function () {
    let productDetails = loadFromLocalStorage('productDetails') || {};
    let cart = [];
    let billHistory = loadFromLocalStorage('billHistory') || [];

    function displayCart() {
        const cartDiv = document.getElementById('cart');
        cartDiv.innerHTML = '';

        cart.forEach((item, index) => {
            const product = productDetails[item.code];
            const itemDiv = document.createElement('div');
            itemDiv.innerHTML = `
                ${product.name} - ₹${product.price} 
                Quantity: <input type="number" value="${item.quantity}" min="1" data-index="${index}">
            `;
            cartDiv.appendChild(itemDiv);
        });

        calculateTotal();
    }

    function calculateTotal() {
        let total = 0;
        cart.forEach(item => {
            const product = productDetails[item.code];
            total += product.price * item.quantity;
        });

        document.getElementById('total').innerText = `Total: ₹${total}`;
    }

    document.getElementById('cart').addEventListener('input', (event) => {
        const input = event.target;
        const index = input.dataset.index;
        const newQuantity = parseInt(input.value, 10);

        if (!isNaN(newQuantity) && newQuantity > 0) {
            cart[index].quantity = newQuantity;
            calculateTotal();
        }
    });

    document.getElementById('save-barcode').addEventListener('click', () => {
        const barcode = document.getElementById('barcode').value;
        const productName = document.getElementById('product-name').value;
        const productPrice = parseFloat(document.getElementById('product-price').value);

        if (barcode && productName && !isNaN(productPrice)) {
            productDetails[barcode] = { name: productName, price: productPrice };
            saveToLocalStorage('productDetails', productDetails);
            alert('Product details saved.');
        } else {
            alert('Please fill in all fields.');
        }
    });

    document.getElementById('generate-bill').addEventListener('click', () => {
        if (cart.length === 0) {
            alert('Cart is empty. Please add items before generating a bill.');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        let yPos = 20;
        doc.setFontSize(16);
        doc.text("Invoice", 90, yPos);
        yPos += 10;

        // Table Header
        doc.setFontSize(12);
        doc.text("Product", 20, yPos);
        doc.text("Qty", 100, yPos);
        doc.text("Price", 140, yPos);
        yPos += 10;

        let totalAmount = 0;
        cart.forEach((item) => {
            const product = productDetails[item.code];
            const itemTotal = product.price * item.quantity;
            totalAmount += itemTotal;

            doc.text(product.name, 20, yPos);
            doc.text(String(item.quantity), 105, yPos);
            doc.text("₹" + itemTotal.toFixed(2), 140, yPos);
            yPos += 10;
        });

        // Total Amount
        yPos += 10;
        doc.setFontSize(14);
        doc.text("Total: ₹" + totalAmount.toFixed(2), 20, yPos);

        // QR Code (Convert to Image)
        const qrCanvas = document.querySelector("#bill-qr-code canvas");
        if (qrCanvas) {
            const qrImage = qrCanvas.toDataURL("image/png");
            doc.addImage(qrImage, "PNG", 20, yPos + 10, 50, 50);
        }

        // Open PDF in new tab
        doc.output("dataurlnewwindow");

        // Save bill to history
        billHistory.push({ date: new Date().toLocaleString(), items: [...cart], total: totalAmount });
        saveToLocalStorage("billHistory", billHistory);

        alert("Total Bill: ₹" + totalAmount);

        // Clear cart
        cart = [];
        displayCart();
    });

    document.getElementById('option5-button').addEventListener('click', () => {
        const billHistoryContainer = document.getElementById('bill-history');
        billHistoryContainer.innerHTML = '';

        if (billHistory.length > 0) {
            billHistory.forEach((bill, index) => {
                let itemsList = '';
                bill.items.forEach(item => {
                    const product = productDetails[item.code];
                    itemsList += `${product.name} (x${item.quantity}) - ₹${product.price * item.quantity}<br>`;
                });

                billHistoryContainer.innerHTML += `
                    <div class="bill">
                        <h3>Bill ${index + 1}</h3>
                        <p><strong>Date/Time:</strong> ${bill.date}</p>
                        <p><strong>Items:</strong><br>${itemsList}</p>
                        <p><strong>Total:</strong> ₹${bill.total}</p>
                        <hr>
                    </div>
                `;
            });
        } else {
            billHistoryContainer.innerHTML = '<p>No bills found.</p>';
        }
    });

    let html5QrcodeScannerOption1 = new Html5QrcodeScanner(
        "my-qr-reader-option1",
        {
            fps: 30,
            qrbox: { width: 250, height: 250 },
            experimentalFeatures: {
                useBarCodeDetectorIfSupported: true
            }
        }
    );
    html5QrcodeScannerOption1.render(onScanSuccessOption1);

    let html5QrcodeScannerOption2 = new Html5QrcodeScanner(
        "my-qr-reader-option2",
        {
            fps: 30,
            qrbox: { width: 250, height: 250 },
            experimentalFeatures: {
                useBarCodeDetectorIfSupported: true
            }
        }
    );
    html5QrcodeScannerOption2.render(onScanSuccessOption2);
});
