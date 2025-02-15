function domReady(fn) {
    if (document.readyState === "complete" || document.readyState === "interactive") {
        setTimeout(fn, 1);
    } else {
        document.addEventListener("DOMContentLoaded", fn);
    }
}

// Initialize jsPDF
window.jsPDF = window.jspdf.jsPDF;

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
    let upiDetails = loadFromLocalStorage('upiDetails') || {};
    let billHistory = loadFromLocalStorage('billHistory') || [];

    // Scanner for Option 1 (Product Setup)
    const html5QrcodeScannerOption1 = new Html5QrcodeScanner(
        "my-qr-reader-option1",
        { fps: 30, qrbox: { width: 250, height: 250 } }
    );
    html5QrcodeScannerOption1.render((decodeText) => {
        document.getElementById('barcode').value = decodeText;
        if (productDetails[decodeText]) {
            document.getElementById('product-name').value = productDetails[decodeText].name;
            document.getElementById('product-price').value = productDetails[decodeText].price;
        } else {
            document.getElementById('product-name').value = '';
            document.getElementById('product-price').value = '';
        }
    });

    // Scanner for Option 2 (Cart)
    const html5QrcodeScannerOption2 = new Html5QrcodeScanner(
        "my-qr-reader-option2",
        { fps: 30, qrbox: { width: 250, height: 250 } }
    );
    html5QrcodeScannerOption2.render((decodeText) => {
        if (productDetails[decodeText]) {
            const existingItem = cart.find(item => item.code === decodeText);
            // Always add new item with quantity 1 if not exists
            if (!existingItem) {
                cart.push({ code: decodeText, quantity: 1 });
                displayCart();
            }
        } else {
            alert(`Product ${decodeText} not found!`);
        }
    });


    // Cart Display
    function displayCart() {
        const cartDiv = document.getElementById('cart');
        cartDiv.innerHTML = '';
        cart.forEach((item, index) => {
            const product = productDetails[item.code];
            const itemDiv = document.createElement('div');
            itemDiv.className = 'cart-item';
            itemDiv.innerHTML = `
                <span class="product-name">${product?.name || 'Unknown Product'}</span>
                <span class="product-price">Rs. ${product?.price?.toFixed(2) || '0.00'}</span>
                <input type="number" 
                       value="${item.quantity}" 
                       min="1" 
                       data-index="${index}"
                       class="quantity-input">
                <span class="item-total">Rs. ${(product?.price * item.quantity).toFixed(2) || '0.00'}</span>
            `;
            cartDiv.appendChild(itemDiv);
        });
        calculateTotal();
    }

    function calculateTotal() {
        const total = cart.reduce((sum, item) => {
            const product = productDetails[item.code];
            return sum + (product?.price || 0) * item.quantity;
        }, 0);
        document.getElementById('total').innerHTML = `<strong>Total:</strong> Rs. ${total.toFixed(2)}`;
    }

    // Event Listeners
    document.getElementById('cart').addEventListener('input', (e) => {
        if (e.target.classList.contains('quantity-input')) {
            const index = e.target.dataset.index;
            const newQty = parseInt(e.target.value);
            if (!isNaN(newQty) && newQty > 0) {
                cart[index].quantity = newQty;
                displayCart();
            }
        }
    });

    document.getElementById('save-barcode').addEventListener('click', () => {
        const barcode = document.getElementById('barcode').value.trim();
        const name = document.getElementById('product-name').value.trim();
        const price = parseFloat(document.getElementById('product-price').value);

        if (barcode && name && !isNaN(price) && price > 0) {
            productDetails[barcode] = { name, price };
            saveToLocalStorage('productDetails', productDetails);
            alert('Product saved successfully!');
        } else {
            alert('Invalid input! Please check all fields.');
        }
    });

    // PDF Generation
    document.getElementById('generate-bill').addEventListener('click', async () => {
        try {
            // Validate UPI details
            if (!upiDetails.upiId || !upiDetails.name || !upiDetails.note) {
                throw new Error('Please configure UPI details first');
            }

            // Calculate total
            const totalAmount = cart.reduce((sum, item) => {
                const product = productDetails[item.code];
                return sum + (product?.price || 0) * item.quantity;
            }, 0);

            // Generate UPI URL
            const upiUrl = `upi://pay?pa=${upiDetails.upiId}` +
                            `&pn=${encodeURIComponent(upiDetails.name)}` +
                            `&am=${totalAmount.toFixed(2)}` +
                            `&cu=INR` +
                            `&tn=${encodeURIComponent(upiDetails.note)}`;

            // Create QR Code
            const qrCode = new QRCodeStyling({
                width: 200,
                height: 200,
                data: upiUrl,
                dotsOptions: {
                    color: "#000",
                    type: "rounded"
                },
                backgroundOptions: {
                    color: "#ffffff"
                }
            });

            // Render QR Code
            const qrContainer = document.getElementById('bill-qr-code');
            qrContainer.innerHTML = '';
            qrCode.append(qrContainer);

            // Wait for QR code rendering
            await new Promise(resolve => setTimeout(resolve, 500));

            // Create PDF
            const doc = new jsPDF();
            let yPos = 20;

            // Header
            doc.setFontSize(22);
            doc.text("INVOICE", 105, yPos, { align: 'center' });
            yPos += 15;

            // Invoice Details
            doc.setFontSize(12);
            doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, yPos);
            doc.text(`Time: ${new Date().toLocaleTimeString()}`, 160, yPos);
            yPos += 15;

            // Table Header
            doc.setFillColor(240, 240, 240);
            doc.rect(20, yPos, 170, 10, 'F');
            doc.setFontSize(12);
            doc.text("Item", 22, yPos + 7);
            doc.text("Qty", 100, yPos + 7);
            doc.text("Price", 160, yPos + 7);
            yPos += 12;

            // Items
            cart.forEach(item => {
                const product = productDetails[item.code];
                doc.setFontSize(10);
                doc.text(product?.name || 'Unknown Item', 22, yPos);
                doc.text(item.quantity.toString(), 102, yPos);
                doc.text(`Rs. ${(product?.price * item.quantity).toFixed(2)}`, 162, yPos);
                yPos += 8;
            });

            // Total
            yPos += 10;
            doc.setFontSize(14);
            doc.text(`Total Amount: Rs. ${totalAmount.toFixed(2)}`, 20, yPos);

            // Add QR Code
            const qrCanvas = qrContainer.querySelector('canvas');
            if (qrCanvas) {
                const qrData = qrCanvas.toDataURL('image/png');
                doc.addImage(qrData, 'PNG', 140, yPos - 10, 50, 50);
            }

            // Save to history
            billHistory.push({
                date: new Date().toLocaleString(),
                total: totalAmount.toFixed(2),
                items: [...cart]
            });
            saveToLocalStorage('billHistory', billHistory);

            // Open PDF
            const pdfBlob = doc.output('blob');
            window.open(URL.createObjectURL(pdfBlob), '_blank');

            // Clear cart
            cart = [];
            displayCart();

        } catch (error) {
            alert(`Error: ${error.message}`);
            console.error(error);
        }
    });

    // UPI Form Handler
    document.getElementById('qrForm').addEventListener('submit', (e) => {
        e.preventDefault();
        upiDetails = {
            upiId: document.getElementById('upi_id').value.trim(),
            name: document.getElementById('name').value.trim(),
            note: document.getElementById('note').value.trim()
        };
        saveToLocalStorage('upiDetails', upiDetails);
        alert('UPI details saved!');
    });

    // Import/Export Handlers
    document.getElementById('download-data').addEventListener('click', () => {
        const data = {
            productDetails,
            upiDetails,
            billHistory
        };
        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'qr-app-data.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });

    document.getElementById('upload-data').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    productDetails = data.productDetails || {};
                    upiDetails = data.upiDetails || {};
                    billHistory = data.billHistory || [];
                    saveToLocalStorage('productDetails', productDetails);
                    saveToLocalStorage('upiDetails', upiDetails);
                    saveToLocalStorage('billHistory', billHistory);
                    alert('Data imported successfully!');
                } catch (error) {
                    alert('Invalid file format!');
                }
            };
            reader.readAsText(file);
        }
    });

    // Bill History Display
    document.getElementById('option5-button').addEventListener('click', () => {
        const historyContainer = document.getElementById('bill-history');
        historyContainer.innerHTML = '';
        
        billHistory.forEach((bill, index) => {
            const billElement = document.createElement('div');
            billElement.className = 'bill-entry';
            billElement.innerHTML = `
                <h3>Bill #${index + 1}</h3>
                <p>Date: ${bill.date}</p>
                <ul>
                    ${bill.items.map(item => `
                        <li>${productDetails[item.code]?.name || 'Unknown'} 
                        (x${item.quantity}) - Rs. ${(productDetails[item.code]?.price * item.quantity).toFixed(2)}</li>
                    `).join('')}
                </ul>
                <p>Total: Rs. ${bill.total}</p>
                <hr>
            `;
            historyContainer.appendChild(billElement);
        });
    });
});
